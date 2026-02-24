export interface ColorTheme {
  name: string;
  label: string;
  previewColor: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const colorThemes: ColorTheme[] = [
  {
    name: "neutral",
    label: "Neutral",
    previewColor: "hsl(240 5.9% 10%)",
    cssVars: { light: {}, dark: {} },
  },
  {
    name: "blue",
    label: "Blue",
    previewColor: "hsl(221 83% 53%)",
    cssVars: {
      light: {
        "--primary": "221 83% 53%",
        "--primary-foreground": "210 40% 98%",
        "--secondary": "210 40% 96%",
        "--secondary-foreground": "222 47% 11%",
        "--chart-1": "221 83% 53%",
        "--chart-2": "212 95% 68%",
        "--chart-3": "216 92% 60%",
        "--chart-4": "210 98% 78%",
        "--chart-5": "214 95% 93%",
        "--sidebar-primary": "221 83% 53%",
        "--sidebar-primary-foreground": "210 40% 98%",
      },
      dark: {
        "--primary": "217 91% 60%",
        "--primary-foreground": "222 47% 11%",
        "--secondary": "217 33% 17%",
        "--secondary-foreground": "210 40% 98%",
        "--chart-1": "221 83% 53%",
        "--chart-2": "212 95% 68%",
        "--chart-3": "216 92% 60%",
        "--chart-4": "210 98% 78%",
        "--chart-5": "214 95% 93%",
        "--sidebar-primary": "217 91% 60%",
        "--sidebar-primary-foreground": "222 47% 11%",
      },
    },
  },
  {
    name: "green",
    label: "Green",
    previewColor: "hsl(142 76% 36%)",
    cssVars: {
      light: {
        "--primary": "142 76% 36%",
        "--primary-foreground": "355 7% 97%",
        "--secondary": "140 49% 96%",
        "--secondary-foreground": "141 79% 10%",
        "--chart-1": "142 76% 36%",
        "--chart-2": "139 65% 44%",
        "--chart-3": "141 52% 54%",
        "--chart-4": "143 64% 72%",
        "--chart-5": "141 79% 85%",
        "--sidebar-primary": "142 76% 36%",
        "--sidebar-primary-foreground": "355 7% 97%",
      },
      dark: {
        "--primary": "142 71% 45%",
        "--primary-foreground": "144 80% 10%",
        "--secondary": "143 25% 17%",
        "--secondary-foreground": "142 70% 95%",
        "--chart-1": "142 76% 36%",
        "--chart-2": "139 65% 44%",
        "--chart-3": "141 52% 54%",
        "--chart-4": "143 64% 72%",
        "--chart-5": "141 79% 85%",
        "--sidebar-primary": "142 71% 45%",
        "--sidebar-primary-foreground": "144 80% 10%",
      },
    },
  },
  {
    name: "rose",
    label: "Rose",
    previewColor: "hsl(347 77% 50%)",
    cssVars: {
      light: {
        "--primary": "347 77% 50%",
        "--primary-foreground": "355 7% 97%",
        "--secondary": "349 52% 96%",
        "--secondary-foreground": "346 80% 14%",
        "--chart-1": "347 77% 50%",
        "--chart-2": "349 65% 58%",
        "--chart-3": "350 80% 72%",
        "--chart-4": "352 83% 82%",
        "--chart-5": "354 100% 90%",
        "--sidebar-primary": "347 77% 50%",
        "--sidebar-primary-foreground": "355 7% 97%",
      },
      dark: {
        "--primary": "347 77% 50%",
        "--primary-foreground": "355 7% 97%",
        "--secondary": "347 30% 17%",
        "--secondary-foreground": "349 80% 95%",
        "--chart-1": "347 77% 50%",
        "--chart-2": "349 65% 58%",
        "--chart-3": "350 80% 72%",
        "--chart-4": "352 83% 82%",
        "--chart-5": "354 100% 90%",
        "--sidebar-primary": "347 77% 50%",
        "--sidebar-primary-foreground": "355 7% 97%",
      },
    },
  },
  {
    name: "orange",
    label: "Orange",
    previewColor: "hsl(25 95% 53%)",
    cssVars: {
      light: {
        "--primary": "25 95% 53%",
        "--primary-foreground": "60 9% 98%",
        "--secondary": "30 60% 96%",
        "--secondary-foreground": "24 80% 14%",
        "--chart-1": "25 95% 53%",
        "--chart-2": "28 85% 60%",
        "--chart-3": "31 90% 68%",
        "--chart-4": "34 100% 78%",
        "--chart-5": "38 100% 88%",
        "--sidebar-primary": "25 95% 53%",
        "--sidebar-primary-foreground": "60 9% 98%",
      },
      dark: {
        "--primary": "21 90% 48%",
        "--primary-foreground": "60 9% 98%",
        "--secondary": "23 30% 17%",
        "--secondary-foreground": "25 90% 95%",
        "--chart-1": "25 95% 53%",
        "--chart-2": "28 85% 60%",
        "--chart-3": "31 90% 68%",
        "--chart-4": "34 100% 78%",
        "--chart-5": "38 100% 88%",
        "--sidebar-primary": "21 90% 48%",
        "--sidebar-primary-foreground": "60 9% 98%",
      },
    },
  },
  {
    name: "violet",
    label: "Violet",
    previewColor: "hsl(263 70% 50%)",
    cssVars: {
      light: {
        "--primary": "263 70% 50%",
        "--primary-foreground": "264 86% 95%",
        "--secondary": "262 50% 96%",
        "--secondary-foreground": "264 75% 14%",
        "--chart-1": "263 70% 50%",
        "--chart-2": "265 60% 58%",
        "--chart-3": "267 72% 68%",
        "--chart-4": "269 80% 78%",
        "--chart-5": "271 91% 88%",
        "--sidebar-primary": "263 70% 50%",
        "--sidebar-primary-foreground": "264 86% 95%",
      },
      dark: {
        "--primary": "263 70% 50%",
        "--primary-foreground": "264 86% 95%",
        "--secondary": "263 28% 17%",
        "--secondary-foreground": "264 80% 95%",
        "--chart-1": "263 70% 50%",
        "--chart-2": "265 60% 58%",
        "--chart-3": "267 72% 68%",
        "--chart-4": "269 80% 78%",
        "--chart-5": "271 91% 88%",
        "--sidebar-primary": "263 70% 50%",
        "--sidebar-primary-foreground": "264 86% 95%",
      },
    },
  },
  {
    name: "teal",
    label: "Teal",
    previewColor: "hsl(172 66% 40%)",
    cssVars: {
      light: {
        "--primary": "172 66% 40%",
        "--primary-foreground": "166 76% 97%",
        "--secondary": "170 50% 96%",
        "--secondary-foreground": "172 70% 12%",
        "--chart-1": "172 66% 40%",
        "--chart-2": "170 55% 48%",
        "--chart-3": "168 50% 58%",
        "--chart-4": "166 60% 70%",
        "--chart-5": "164 65% 82%",
        "--sidebar-primary": "172 66% 40%",
        "--sidebar-primary-foreground": "166 76% 97%",
      },
      dark: {
        "--primary": "172 60% 45%",
        "--primary-foreground": "172 70% 10%",
        "--secondary": "172 25% 17%",
        "--secondary-foreground": "170 60% 95%",
        "--chart-1": "172 66% 40%",
        "--chart-2": "170 55% 48%",
        "--chart-3": "168 50% 58%",
        "--chart-4": "166 60% 70%",
        "--chart-5": "164 65% 82%",
        "--sidebar-primary": "172 60% 45%",
        "--sidebar-primary-foreground": "172 70% 10%",
      },
    },
  },
];

export const COLOR_THEME_KEY = "cuview-color-theme";
export const DEFAULT_COLOR_THEME = "neutral";

export function getColorTheme(name: string): ColorTheme | undefined {
  return colorThemes.find((t) => t.name === name);
}
