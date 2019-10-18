import ContestParticipation from "../interfaces/ContestParticipation";
import { List } from "immutable";

export class RatingInfo {
  readonly rating: number;
  readonly participationCount: number;
  readonly internalRating: number | null;

  constructor(rating: number, participationCount: number) {
    this.rating = rating;
    this.participationCount = participationCount;

    if (participationCount === 0) {
      this.internalRating = null;
    } else {
      let ratingBeforeLowerAdjustment: number;
      if (rating <= 400) {
        ratingBeforeLowerAdjustment = 400 * (1 - Math.log(400 / rating));
      } else {
        ratingBeforeLowerAdjustment = rating;
      }
      const participationAdjustment =
        ((Math.sqrt(1 - 0.9 ** (2 * participationCount)) /
          (1 - 0.9 ** participationCount) -
          1) /
          (Math.sqrt(19) - 1)) *
        1200;
      this.internalRating =
        ratingBeforeLowerAdjustment + participationAdjustment;
    }
  }
}

export const ratingInfoOf = (
  contestHistory: List<ContestParticipation>
): RatingInfo => {
  const latestRating = contestHistory.last({ NewRating: 0 }).NewRating;
  const ratedCount = contestHistory
    .filter(participation => participation.IsRated)
    .count();
  return new RatingInfo(latestRating, ratedCount);
};
