import moment from "moment";
import { getThisSunday } from "./DateUtil";

describe("get this Sunday", () => {
  it("when it's Thursday", () => {
    const thursday = moment("2019-08-15T14:24:00");
    const sunday = getThisSunday(thursday);
    expect(sunday.date()).toBe(18);
  });

  it("when it's Sunday", () => {
    const sunday = moment("2019-08-18T14:24:00");
    expect(getThisSunday(sunday).date()).toBe(18);
  });
});
