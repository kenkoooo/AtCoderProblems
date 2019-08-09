import {
  ATCODER_RIVALS_REGEXP,
  ATCODER_USER_REGEXP,
  extractRivalsParam
} from "./index";

describe ("user regex", () => {
  it ("should match", () => {
    expect("user_1a".match(ATCODER_USER_REGEXP)).toBeTruthy();
  });

  it ("should not match", () => {
    expect("user;".match(ATCODER_USER_REGEXP)).toBeFalsy();
  });
});

describe ("rival regex", () => {
  it ("should match", () => {
    expect(" user1 , USER2, user_3 ".match(ATCODER_RIVALS_REGEXP)).toBeTruthy();
  });

  it ("empty string should not match", () => {
    expect("".match(ATCODER_RIVALS_REGEXP)).toBeFalsy();
  });

  it ("user names separated spaces should not match", () => {
    expect("user1 user2".match(ATCODER_RIVALS_REGEXP)).toBeFalsy();
  });

  it ("user names including invalid char should not match", () => {
    expect("user^, user|".match(ATCODER_RIVALS_REGEXP)).toBeFalsy();
  });
});

it ("extract rival params", () => {
  expect(extractRivalsParam(" user1 , USER2, user_3 "))
    .toMatchObject(["user1", "USER2", "user_3"]);
});
