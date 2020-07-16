export function calculatePerformances(
  participantRawRatings: number[]
): number[] {
  const perfs: number[] = [];
  const predictedRankCache = new Map();
  const participants = participantRawRatings.length;
  for (let position = 0; position < participants; position++) {
    let ub = 10000;
    let lb = -10000;
    while (Math.round(lb) < Math.round(ub)) {
      const m = (lb + ub) / 2;
      if (!predictedRankCache.has(m)) {
        let predictedRank = 0;
        for (const participantRawRating of participantRawRatings) {
          predictedRank += 1 / (1 + 6.0 ** ((m - participantRawRating) / 400));
        }
        predictedRankCache.set(m, predictedRank);
      }
      const predictedRank = predictedRankCache.get(m);
      if (predictedRank < position + 0.5) {
        ub = m;
      } else {
        lb = m;
      }
    }
    perfs.push(Math.round(lb));
  }
  return perfs;
}
