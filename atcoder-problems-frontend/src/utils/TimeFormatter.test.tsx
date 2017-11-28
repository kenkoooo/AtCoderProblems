import { TimeFormatter } from "./TimeFormatter";
test("format time", () => {
  let currentTimeMillis = 1511879207885;
  expect(TimeFormatter.getDateString(currentTimeMillis)).toEqual("2017-11-28");
});
