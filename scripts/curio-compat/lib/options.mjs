export class CurioCompatUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "CurioCompatUsageError";
    this.exitCode = 2;
  }
}

export function parseArgs(argv) {
  const options = {
    curioRepo: null,
    fetch: false,
    from: null,
    outDir: null,
    to: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (arg === "--fetch") {
      options.fetch = true;
      continue;
    }
    if (
      arg === "--curio-repo" ||
      arg === "--from" ||
      arg === "--to" ||
      arg === "--out"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new CurioCompatUsageError(`${arg} requires a value`);
      }
      if (value.includes("\u0000")) {
        throw new CurioCompatUsageError(`${arg} contains an invalid value`);
      }
      index += 1;
      if (arg === "--curio-repo") options.curioRepo = value;
      if (arg === "--from") options.from = value;
      if (arg === "--to") options.to = value;
      if (arg === "--out") options.outDir = value;
      continue;
    }
    throw new CurioCompatUsageError(`Unknown argument: ${arg}`);
  }

  for (const key of ["curioRepo", "from", "to"]) {
    if (!options[key]) {
      throw new CurioCompatUsageError(`--${kebab(key)} is required`);
    }
  }
  return options;
}

function kebab(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
