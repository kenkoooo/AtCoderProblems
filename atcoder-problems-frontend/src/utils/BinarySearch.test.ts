import { binarySearch } from "./BinarySearch";

describe("binary search", () => {
  it("same type value", () => {
    expect(binarySearch([0, 1, 2, 3, 4], 1, (a, b) => a - b)).toBe(1);
    expect(binarySearch([0, 1, 1, 3, 4], 1, (a, b) => a - b)).toBe(1);
    expect(binarySearch([1, 1, 1, 3, 4], 1, (a, b) => a - b)).toBe(0);
    expect(binarySearch([0, 1, 1, 1, 4], 1, (a, b) => a - b)).toBe(1);
    expect(binarySearch([0, 1, 2, 2, 4], 2, (a, b) => a - b)).toBe(2);
    expect(binarySearch([0, 1, 2, 2, 4], 3, (a, b) => a - b)).toBe(4);
    expect(binarySearch([0, 1, 2, 2, 4], 5, (a, b) => a - b)).toBe(5);
  });

  it("different type value", () => {
    expect(binarySearch([0, 1, 2, 3, 4], { v: 1 }, (a, b) => a - b.v)).toBe(1);
    expect(binarySearch([0, 1, 1, 3, 4], { v: 1 }, (a, b) => a - b.v)).toBe(1);
    expect(binarySearch([1, 1, 1, 3, 4], { v: 1 }, (a, b) => a - b.v)).toBe(0);
    expect(binarySearch([0, 1, 1, 1, 4], { v: 1 }, (a, b) => a - b.v)).toBe(1);
    expect(binarySearch([0, 1, 2, 2, 4], { v: 2 }, (a, b) => a - b.v)).toBe(2);
    expect(binarySearch([0, 1, 2, 2, 4], { v: 5 }, (a, b) => a - b.v)).toBe(5);
  });
});
