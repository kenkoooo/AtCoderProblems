import { convertProblemTitleForSorting } from "./ContestTable";

describe("Convert a problem title", () => {
  it("No number", () => {
    const title = "J. Kuru Kuru Kururin";
    expect(convertProblemTitleForSorting(title)).toMatchObject(["J", NaN]);
  });

  it("No string", () => {
    const title = "1000000007. The Most Famous Prime Number";
    expect(convertProblemTitleForSorting(title)).toMatchObject([
      "",
      1000000007,
    ]);
  });

  it("Both exists", () => {
    const title = "EX1. 1.01";
    expect(convertProblemTitleForSorting(title)).toMatchObject(["EX", 1]);
  });
});
