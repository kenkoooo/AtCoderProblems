export const normalizeLanguage = (language: string): string => {
  if (language.startsWith("Perl6")) {
    return "Perl6";
  } else {
    return language.replace(/\d*\s*\(.*\)$/, "");
  }
};
