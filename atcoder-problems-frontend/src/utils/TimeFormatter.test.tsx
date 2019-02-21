import { TimeFormatter } from "./TimeFormatter";
test("format time", () => {
  let currentTimeMillis = 1550761200000;
  expect(TimeFormatter.getDateString(currentTimeMillis)).toEqual("2019-02-22");
});
