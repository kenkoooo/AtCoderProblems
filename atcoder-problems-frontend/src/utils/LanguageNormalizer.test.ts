import { normalizeLanguage } from "./LanguageNormalizer";

test("normalize language", () => {
  expect(normalizeLanguage("Perl (v5.18.2)")).toBe("Perl");
  expect(normalizeLanguage("Perl6 (rakudo-star 2016.01)")).toBe("Raku");
  expect(normalizeLanguage("Rust (1.42.0)")).toBe("Rust");
  expect(normalizeLanguage("C++11 (Clang++ 3.4)")).toBe("C++");
  expect(normalizeLanguage("Scala (2.11.7)")).toBe("Scala");
  expect(normalizeLanguage("Fortran(GNU Fortran 9.2.1)")).toBe("Fortran");
});
