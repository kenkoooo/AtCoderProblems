import { groupBy } from "./GroupBy";

test("group by", () => {
  const array = [
    { group: 1, value: 1 },
    { group: 2, value: 2 },
    { group: 2, value: 3 },
    { group: 1, value: 4 },
  ];

  const map = groupBy(array, (item) => item.group);
  expect(map.get(1)?.some((item) => item.value === 1)).toBe(true);
  expect(map.get(1)?.some((item) => item.value === 4)).toBe(true);
  expect(map.get(2)?.some((item) => item.value === 2)).toBe(true);
  expect(map.get(2)?.some((item) => item.value === 3)).toBe(true);
});
