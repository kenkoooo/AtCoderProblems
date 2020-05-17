import {
  ATCODER_RIVALS_REGEXP,
  ATCODER_USER_REGEXP,
  extractRivalsParam,
  normalizeUserId,
} from "./index";

describe("user regex", () => {
  it("should match", () => {
    expect(ATCODER_USER_REGEXP.exec("user_1a")).toBeTruthy();
  });

  it("should not match", () => {
    expect(ATCODER_USER_REGEXP.exec("user;")).toBeFalsy();
  });
});

describe("rival regex", () => {
  it("should match", () => {
    expect(ATCODER_RIVALS_REGEXP.exec(" user1 , USER2, user_3 ")).toBeTruthy();
  });

  it("empty string should not match", () => {
    expect(ATCODER_RIVALS_REGEXP.exec("")).toBeFalsy();
  });

  it("user names separated spaces should not match", () => {
    expect(ATCODER_RIVALS_REGEXP.exec("user1 user2")).toBeFalsy();
  });

  it("user names including invalid char should not match", () => {
    expect(ATCODER_RIVALS_REGEXP.exec("user^, user|")).toBeFalsy();
  });
});

it("extract rival params", () => {
  expect(extractRivalsParam(" user1 , USER2, user_3 ")).toMatchObject([
    "user1",
    "USER2",
    "user_3",
  ]);
});

it("should normalize user id", () => {
  expect(normalizeUserId("   userid")).toBe("userid");
  expect(normalizeUserId("userid   ")).toBe("userid");
  expect(normalizeUserId("  userid ")).toBe("userid");
  expect(normalizeUserId("userid")).toBe("userid");
  expect(normalizeUserId("user id")).toBe("");
});
