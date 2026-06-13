const mapping: [string, string][] = [
  ["PyPy", "Python"],
  ["Python (Cython", "Cython"],
  ["Assembly x64", "Assembly x64"],
  ["Awk", "AWK"],
  ["IOI-Style", "C++"],
  ["LuaJIT", "Lua"],
  ["Seed7", "Seed7"],
  ["Perl6", "Raku"],
  ["Objective-C", "Objective-C"],
];

export const normalizeLanguage = (language: string): string => {
  for (const [beginning, normalized] of mapping) {
    if (language.startsWith(beginning)) {
      return normalized;
    }
  }

  return language.replace(/\s*[\d(-].*/, "") || "Unknown";
};
