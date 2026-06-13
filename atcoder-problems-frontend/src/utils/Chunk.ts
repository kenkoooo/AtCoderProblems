export const toChunks = <T>(array: T[], size: number) => {
  let chunk = [] as T[];
  const chunks = [] as T[][];
  for (const element of array) {
    chunk.push(element);
    if (chunk.length === size) {
      chunks.push(chunk);
      chunk = [];
    }
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
};
