import { Submission } from "../model/Submission";
import { MergedProblem } from "../model/MergedProblem";

export class PointDistribution {
  /**
   * count accepted problems by point
   * @param submissions submissions
   * @param problems problem list
   * @param userId user id to filter
   * @returns Map(point -> count)
   */
  static countAcceptedByPoint(
    submissions: Array<Submission>,
    problems: Array<MergedProblem>,
    userId: String
  ): Map<number, number> {
    let problemSet = new Set(
      submissions
        .filter(s => s.result === "AC" && s.user_id === userId)
        .map(s => s.problem_id)
    );

    let count = new Map<number, number>();
    problems.filter(p => problemSet.has(p.id) && p.point).forEach(p => {
      if (!count.has(p.point)) {
        count.set(p.point, 0);
      }
      count.set(p.point, count.get(p.point) + 1);
    });

    return count;
  }
}
