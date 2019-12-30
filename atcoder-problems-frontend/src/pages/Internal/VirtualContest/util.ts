export const compareProblem = (
  a: {
    id: string;
    order: number | null;
  },
  b: { id: string; order: number | null }
) => {
  if (a.order !== null && b.order !== null) {
    return a.order - b.order;
  }
  return a.id.localeCompare(b.id);
};
