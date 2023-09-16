import { normalizeLanguage } from "./LanguageNormalizer";

test("normalize language", () => {
  expect(normalizeLanguage("Perl (v5.18.2)")).toBe("Perl");
  expect(normalizeLanguage("Perl6 (rakudo-star 2016.01)")).toBe("Raku");
  expect(normalizeLanguage("Rust (1.42.0)")).toBe("Rust");
  expect(normalizeLanguage("C++11 (Clang++ 3.4)")).toBe("C++");
  expect(normalizeLanguage("C++ 20 (gcc 12.2)")).toBe("C++");
  expect(normalizeLanguage("Scala (2.11.7)")).toBe("Scala");
  expect(normalizeLanguage("Scala 3.3.0 (Scala Native 0.4.14)")).toBe("Scala");
  expect(normalizeLanguage("Fortran(GNU Fortran 9.2.1)")).toBe("Fortran");
  expect(normalizeLanguage("C# 11.9 (.NET 7.0.7)")).toBe("C#");
  expect(normalizeLanguage("F# 7.0 (.NET 7.0.7)")).toBe("F#");
  expect(normalizeLanguage("Visual Basic 16.9 (.NET 7.0.7)")).toBe("Visual Basic");
  expect(normalizeLanguage("TypeScript 5.1 (Node.js 18.16.1)")).toBe("TypeScript");
});
