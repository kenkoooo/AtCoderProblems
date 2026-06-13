import { normalizeLanguage } from "./LanguageNormalizer";

test("normalize language", () => {
  expect(normalizeLanguage("Perl (v5.18.2)")).toBe("Perl");
  expect(normalizeLanguage("Perl6 (rakudo-star 2016.01)")).toBe("Raku");
  expect(normalizeLanguage("Rust (1.42.0)")).toBe("Rust");
  expect(normalizeLanguage("C++11 (Clang++ 3.4)")).toBe("C++");
  expect(normalizeLanguage("Scala (2.11.7)")).toBe("Scala");
  expect(normalizeLanguage("Fortran(GNU Fortran 9.2.1)")).toBe("Fortran");
  expect(normalizeLanguage("Ada2012 (GNAT 9.2.1)")).toBe("Ada");
  expect(normalizeLanguage("Haxe (4.0.3); js")).toBe("Haxe");
  expect(normalizeLanguage("C++11 (Clang++ 3.4)")).toBe("C++");
  expect(normalizeLanguage("C++ 20 (gcc 12.2)")).toBe("C++");
  expect(normalizeLanguage("C# 11.0 (.NET 7.0.7)")).toBe("C#");
  expect(normalizeLanguage("C# 11.0 AOT (.NET 7.0.7)")).toBe("C#");
  expect(normalizeLanguage("Visual Basic 16.9 (...)")).toBe("Visual Basic");
  expect(normalizeLanguage("><> (fishr 0.1.0)")).toBe("><>");
  expect(normalizeLanguage("プロデル (...)")).toBe("プロデル");

  // mapped individually
  expect(normalizeLanguage("Assembly x64")).toBe("Assembly x64");
  expect(normalizeLanguage("Awk (GNU Awk 4.1.4)")).toBe("AWK");
  expect(normalizeLanguage("IOI-Style C++ (GCC 5.4.1)")).toBe("C++");
  expect(normalizeLanguage("LuaJIT (2.0.4)")).toBe("Lua");
  expect(normalizeLanguage("Objective-C (Clang3.8.0)")).toBe("Objective-C");
  expect(normalizeLanguage("PyPy2 (7.3.0)")).toBe("Python");
  expect(normalizeLanguage("Python (Cython 0.29.34)")).toBe("Cython");
  expect(normalizeLanguage("Cython (0.29.16)")).toBe("Cython");
  expect(normalizeLanguage("Seed7 (Seed7 3.2.1)")).toBe("Seed7");

  expect(normalizeLanguage("1234")).toBe("Unknown");
});
