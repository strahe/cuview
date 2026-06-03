package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"os"
	"os/exec"
	"path"
	"reflect"
	"sort"
	"strconv"
	"strings"
)

type contract struct {
	RPCMethods map[string]rpcMethod `json:"rpcMethods"`
	RestRoutes []restRoute          `json:"restRoutes"`
}

type rpcMethod struct {
	Fields []string   `json:"fields"`
	Params []paramDef `json:"params"`
}

type paramDef struct {
	Type string `json:"type"`
}

type restRoute struct {
	Method string `json:"method"`
	Path   string `json:"path"`
}

type parsedFile struct {
	file          string
	importAliases map[string]string
	packagePath   string
	parsed        *ast.File
}

type structDef struct {
	embedded      []ast.Expr
	fields        []fieldDef
	importAliases map[string]string
	packagePath   string
}

type aliasDef struct {
	expr          ast.Expr
	importAliases map[string]string
	packagePath   string
}

type fieldDef struct {
	name string
	tag  string
}

func main() {
	repo := flag.String("repo", "", "Curio repository path")
	ref := flag.String("ref", "", "Git ref")
	flag.Parse()

	if *repo == "" || *ref == "" {
		fmt.Fprintln(os.Stderr, "--repo and --ref are required")
		os.Exit(2)
	}

	result, err := inspect(*repo, *ref)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	encoded, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	fmt.Println(string(encoded))
}

func inspect(repo string, ref string) (*contract, error) {
	modulePath, err := readModulePath(repo, ref)
	if err != nil {
		return nil, err
	}
	files, err := listFiles(repo, ref)
	if err != nil {
		return nil, err
	}

	parsedFiles := []parsedFile{}
	for _, file := range files {
		if !strings.HasSuffix(file, ".go") || strings.HasSuffix(file, "_test.go") {
			continue
		}
		content, err := gitShow(repo, ref, file)
		if err != nil {
			return nil, err
		}
		fset := token.NewFileSet()
		parsed, err := parser.ParseFile(fset, file, content, parser.ParseComments)
		if err != nil {
			return nil, fmt.Errorf("parse %s: %w", file, err)
		}
		parsedFiles = append(parsedFiles, parsedFile{
			file:          file,
			importAliases: collectImportAliases(parsed),
			packagePath:   packageImportPath(modulePath, file),
			parsed:        parsed,
		})
	}

	structs, aliases := collectTypes(parsedFiles)
	output := &contract{
		RPCMethods: map[string]rpcMethod{},
		RestRoutes: []restRoute{},
	}

	for _, file := range parsedFiles {
		if strings.HasPrefix(file.file, "web/api/webrpc/") {
			collectRPCMethods(output, file, structs, aliases)
		}
		if strings.HasPrefix(file.file, "web/api/") {
			collectRestRoutes(output, file)
		}
	}
	output.RestRoutes = dedupeRestRoutes(output.RestRoutes)
	sort.Slice(output.RestRoutes, func(i, j int) bool {
		return restKey(output.RestRoutes[i]) < restKey(output.RestRoutes[j])
	})
	return output, nil
}

func collectTypes(files []parsedFile) (map[string]structDef, map[string]aliasDef) {
	structs := map[string]structDef{}
	aliases := map[string]aliasDef{}
	for _, file := range files {
		for _, decl := range file.parsed.Decls {
			genDecl, ok := decl.(*ast.GenDecl)
			if !ok || genDecl.Tok != token.TYPE {
				continue
			}
			for _, spec := range genDecl.Specs {
				typeSpec, ok := spec.(*ast.TypeSpec)
				if !ok {
					continue
				}
				key := fullTypeKey(file.packagePath, typeSpec.Name.Name)
				if structType, ok := typeSpec.Type.(*ast.StructType); ok {
					fields, embedded := readStructFields(structType)
					structs[key] = structDef{
						embedded:      embedded,
						fields:        fields,
						importAliases: file.importAliases,
						packagePath:   file.packagePath,
					}
					continue
				}
				aliases[key] = aliasDef{
					expr:          typeSpec.Type,
					importAliases: file.importAliases,
					packagePath:   file.packagePath,
				}
			}
		}
	}
	return structs, aliases
}

func collectRPCMethods(output *contract, file parsedFile, structs map[string]structDef, aliases map[string]aliasDef) {
	for _, decl := range file.parsed.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Recv == nil || !ast.IsExported(fn.Name.Name) {
			continue
		}
		if receiverName(fn.Recv) != "WebRPC" {
			continue
		}
		fields, resolved := responseFields(fn.Type.Results, file, structs, aliases)
		if !resolved {
			fields = nil
		}
		output.RPCMethods[fn.Name.Name] = rpcMethod{
			Fields: fields,
			Params: readParams(fn.Type.Params),
		}
	}
}

func collectRestRoutes(output *contract, file parsedFile) {
	ast.Inspect(file.parsed, func(node ast.Node) bool {
		call, ok := node.(*ast.CallExpr)
		if !ok {
			return true
		}
		if method, routePath, ok := routeFromMethodsCall(call); ok {
			output.RestRoutes = append(output.RestRoutes, restRoute{
				Method: method,
				Path:   normalizeRoutePath(restPrefix(file.file), routePath),
			})
			return true
		}
		if method, routePath, ok := routeFromPathCall(call); ok {
			output.RestRoutes = append(output.RestRoutes, restRoute{
				Method: method,
				Path:   normalizeRoutePath(restPrefix(file.file), routePath),
			})
		}
		return true
	})
}

func routeFromMethodsCall(call *ast.CallExpr) (string, string, bool) {
	selector, ok := call.Fun.(*ast.SelectorExpr)
	if !ok || selector.Sel.Name != "Methods" || len(call.Args) == 0 {
		return "", "", false
	}
	method, ok := stringArg(call.Args[0])
	if !ok {
		return "", "", false
	}
	inner, ok := selector.X.(*ast.CallExpr)
	if !ok {
		return "", "", false
	}
	innerSelector, ok := inner.Fun.(*ast.SelectorExpr)
	if !ok || (innerSelector.Sel.Name != "HandleFunc" && innerSelector.Sel.Name != "Handle") || len(inner.Args) == 0 {
		return "", "", false
	}
	routePath, ok := stringArg(inner.Args[0])
	return method, routePath, ok
}

func routeFromPathCall(call *ast.CallExpr) (string, string, bool) {
	selector, ok := call.Fun.(*ast.SelectorExpr)
	if !ok || selector.Sel.Name != "Path" || len(call.Args) == 0 {
		return "", "", false
	}
	routePath, ok := stringArg(call.Args[0])
	if !ok {
		return "", "", false
	}
	inner, ok := selector.X.(*ast.CallExpr)
	if !ok {
		return "", "", false
	}
	innerSelector, ok := inner.Fun.(*ast.SelectorExpr)
	if !ok || innerSelector.Sel.Name != "Methods" || len(inner.Args) == 0 {
		return "", "", false
	}
	method, ok := stringArg(inner.Args[0])
	return method, routePath, ok
}

func readParams(fields *ast.FieldList) []paramDef {
	if fields == nil {
		return []paramDef{}
	}
	params := []paramDef{}
	for _, field := range fields.List {
		if isContext(field.Type) {
			continue
		}
		count := len(field.Names)
		if count == 0 {
			count = 1
		}
		for i := 0; i < count; i++ {
			params = append(params, paramDef{Type: exprString(field.Type)})
		}
	}
	return params
}

func responseFields(results *ast.FieldList, file parsedFile, structs map[string]structDef, aliases map[string]aliasDef) ([]string, bool) {
	if results == nil {
		return []string{}, true
	}
	for _, result := range results.List {
		if isError(result.Type) {
			continue
		}
		return resolveFields(result.Type, file.packagePath, file.importAliases, structs, aliases, map[string]bool{})
	}
	return []string{}, true
}

func resolveFields(expr ast.Expr, packagePath string, imports map[string]string, structs map[string]structDef, aliases map[string]aliasDef, seen map[string]bool) ([]string, bool) {
	expr = unwrapType(expr)
	switch value := expr.(type) {
	case *ast.Ident:
		if isScalar(value.Name) {
			return []string{}, true
		}
		key := fullTypeKey(packagePath, value.Name)
		return fieldsForKey(key, structs, aliases, seen)
	case *ast.SelectorExpr:
		ident, ok := value.X.(*ast.Ident)
		if !ok {
			return nil, false
		}
		importPath := imports[ident.Name]
		if importPath == "" {
			return nil, false
		}
		return fieldsForKey(fullTypeKey(importPath, value.Sel.Name), structs, aliases, seen)
	case *ast.MapType, *ast.InterfaceType:
		return []string{}, true
	case *ast.StructType:
		fields, embedded := readStructFields(value)
		output := []string{}
		for _, embeddedField := range embedded {
			embeddedFields, ok := resolveFields(embeddedField, packagePath, imports, structs, aliases, seen)
			if !ok {
				return nil, false
			}
			output = append(output, embeddedFields...)
		}
		output = append(output, wireFields(fields)...)
		return dedupeStrings(output), true
	default:
		return nil, false
	}
}

func fieldsForKey(key string, structs map[string]structDef, aliases map[string]aliasDef, seen map[string]bool) ([]string, bool) {
	if seen[key] {
		return nil, false
	}
	seen[key] = true
	defer delete(seen, key)
	if def, ok := structs[key]; ok {
		fields := []string{}
		for _, embedded := range def.embedded {
			embeddedFields, ok := resolveFields(embedded, def.packagePath, def.importAliases, structs, aliases, seen)
			if !ok {
				return nil, false
			}
			fields = append(fields, embeddedFields...)
		}
		fields = append(fields, wireFields(def.fields)...)
		return dedupeStrings(fields), true
	}
	if alias, ok := aliases[key]; ok {
		return resolveFields(alias.expr, alias.packagePath, alias.importAliases, structs, aliases, seen)
	}
	return nil, false
}

func readStructFields(structType *ast.StructType) ([]fieldDef, []ast.Expr) {
	fields := []fieldDef{}
	embedded := []ast.Expr{}
	for _, field := range structType.Fields.List {
		if len(field.Names) == 0 {
			embedded = append(embedded, field.Type)
			continue
		}
		tag := ""
		if field.Tag != nil {
			tag = strings.Trim(field.Tag.Value, "`")
		}
		for _, name := range field.Names {
			fields = append(fields, fieldDef{name: name.Name, tag: tag})
		}
	}
	return fields, embedded
}

func wireFields(fields []fieldDef) []string {
	output := []string{}
	for _, field := range fields {
		name := field.name
		if field.tag != "" {
			jsonName := strings.Split(reflect.StructTag(field.tag).Get("json"), ",")[0]
			if jsonName == "-" {
				continue
			}
			if jsonName != "" {
				name = jsonName
			}
		}
		output = append(output, name)
	}
	return output
}

func dedupeStrings(values []string) []string {
	seen := map[string]bool{}
	output := []string{}
	for _, value := range values {
		if seen[value] {
			continue
		}
		seen[value] = true
		output = append(output, value)
	}
	return output
}

func receiverName(recv *ast.FieldList) string {
	if recv == nil || len(recv.List) == 0 {
		return ""
	}
	switch value := recv.List[0].Type.(type) {
	case *ast.Ident:
		return value.Name
	case *ast.StarExpr:
		if ident, ok := value.X.(*ast.Ident); ok {
			return ident.Name
		}
	}
	return ""
}

func unwrapType(expr ast.Expr) ast.Expr {
	for {
		switch value := expr.(type) {
		case *ast.StarExpr:
			expr = value.X
		case *ast.ArrayType:
			expr = value.Elt
		case *ast.Ellipsis:
			expr = value.Elt
		default:
			return expr
		}
	}
}

func isContext(expr ast.Expr) bool {
	selector, ok := expr.(*ast.SelectorExpr)
	if !ok || selector.Sel.Name != "Context" {
		return false
	}
	ident, ok := selector.X.(*ast.Ident)
	return ok && ident.Name == "context"
}

func isError(expr ast.Expr) bool {
	ident, ok := expr.(*ast.Ident)
	return ok && ident.Name == "error"
}

func isScalar(name string) bool {
	switch name {
	case "string", "bool", "byte", "rune", "int", "int8", "int16", "int32", "int64",
		"uint", "uint8", "uint16", "uint32", "uint64", "uintptr", "float32", "float64":
		return true
	default:
		return false
	}
}

func collectImportAliases(file *ast.File) map[string]string {
	aliases := map[string]string{}
	for _, importSpec := range file.Imports {
		importPath, err := strconv.Unquote(importSpec.Path.Value)
		if err != nil {
			continue
		}
		alias := path.Base(importPath)
		if importSpec.Name != nil && importSpec.Name.Name != "_" && importSpec.Name.Name != "." {
			alias = importSpec.Name.Name
		}
		aliases[alias] = importPath
	}
	return aliases
}

func restPrefix(file string) string {
	switch {
	case strings.HasPrefix(file, "web/api/config/"):
		return "/api/config"
	case strings.HasPrefix(file, "web/api/sector/"):
		return "/api/sector"
	case strings.HasPrefix(file, "web/api/webrpc/"):
		return "/api/webrpc"
	default:
		return ""
	}
}

func normalizeRoutePath(prefix string, routePath string) string {
	if strings.HasPrefix(routePath, "/api/") || routePath == "/api" {
		return cleanPath(routePath)
	}
	return cleanPath(prefix + "/" + strings.TrimPrefix(routePath, "/"))
}

func cleanPath(value string) string {
	value = "/" + strings.Trim(value, "/")
	if value == "/" {
		return "/"
	}
	return value
}

func stringArg(expr ast.Expr) (string, bool) {
	lit, ok := expr.(*ast.BasicLit)
	if !ok || lit.Kind != token.STRING {
		return "", false
	}
	value, err := strconv.Unquote(lit.Value)
	if err != nil {
		return "", false
	}
	return value, true
}

func dedupeRestRoutes(routes []restRoute) []restRoute {
	seen := map[string]bool{}
	output := []restRoute{}
	for _, route := range routes {
		key := restKey(route)
		if seen[key] {
			continue
		}
		seen[key] = true
		output = append(output, route)
	}
	return output
}

func restKey(route restRoute) string {
	return route.Method + " " + route.Path
}

func readModulePath(repo string, ref string) (string, error) {
	content, err := gitShow(repo, ref, "go.mod")
	if err != nil {
		return "", err
	}
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "module ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "module ")), nil
		}
	}
	return "", fmt.Errorf("module path not found in go.mod")
}

func packageImportPath(modulePath string, file string) string {
	dir := path.Dir(file)
	if dir == "." {
		return modulePath
	}
	return modulePath + "/" + dir
}

func fullTypeKey(packagePath string, name string) string {
	return packagePath + "." + name
}

func listFiles(repo string, ref string) ([]string, error) {
	output, err := git(repo, "ls-tree", "-r", "--name-only", ref)
	if err != nil {
		return nil, err
	}
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) == 1 && lines[0] == "" {
		return []string{}, nil
	}
	return lines, nil
}

func gitShow(repo string, ref string, file string) (string, error) {
	return git(repo, "show", ref+":"+file)
}

func git(repo string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = repo
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("git %v failed: %w (stderr: %s)", args, err, strings.TrimSpace(stderr.String()))
	}
	return string(output), nil
}

func exprString(expr ast.Expr) string {
	var buf bytes.Buffer
	if err := printer.Fprint(&buf, token.NewFileSet(), expr); err != nil {
		return ""
	}
	return buf.String()
}
