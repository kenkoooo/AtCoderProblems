import { isContest } from "./Contest";

describe("Contest type guard", () => {
  it("should return true", () => {
    expect(
      isContest({
        start_epoch_second: 10,
        rate_change: "",
        id: "",
        duration_second: 1,
        title: "",
      })
    ).toBeTruthy();
  });
  it("should return false for undefined fields", () => {
    expect(
      isContest({
        rate_change: "",
        id: "",
        duration_second: 1,
        title: "",
      })
    ).toBeFalsy();
    expect(
      isContest({
        start_epoch_second: 10,
        id: "",
        duration_second: 1,
        title: "",
      })
    ).toBeFalsy();
  });
  it("should return false for different types", () => {
    expect(
      isContest({
        start_epoch_second: 10,
        rate_change: "",
        id: "",
        duration_second: 1,
        title: 0,
      })
    ).toBeFalsy();
    expect(
      isContest({
        start_epoch_second: 10,
        rate_change: "",
        id: 1,
        duration_second: 1,
        title: "",
      })
    ).toBeFalsy();
  });
});
