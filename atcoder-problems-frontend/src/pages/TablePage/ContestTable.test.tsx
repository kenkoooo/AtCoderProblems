import { convertProblemIndexForSorting } from "./ContestTable";

describe("Convert a problem index", () => {
  it("No number", () => {
    const index = "J";
    expect(convertProblemIndexForSorting(index)).toMatchObject(["J", NaN]);
  });

  it("No string", () => {
    const index = "1000000007";
    expect(convertProblemIndexForSorting(index)).toMatchObject([
      "",
      1000000007,
    ]);
  });

  it("Both exists", () => {
    const index = "EX1";
    expect(convertProblemIndexForSorting(index)).toMatchObject(["EX", 1]);
  });
});
