export const normalizeLanguage = (language: string): string => {
  if (language.startsWith("Perl6")) {
    return "Raku";
  } else {
    return language.replace(/\d*\s*\(.*\)$/, "");
  }
};
