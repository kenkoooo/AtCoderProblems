import { Submission } from "../model/Submission";

export class SubmissionUtils {
  /**
   * extract problem ids of the given result with the given users
   * @param submissions list of submissions
   * @param userIds set of user ids
   * @param resultToExtract set of results to extract
   * @returns map of <problem id, submission result>
   */
  static extractProblemIdsByUsers(
    submissions: Array<Submission>,
    userIds: Set<string>,
    resultToExtract: Set<string> = new Set(["AC"])
  ): Map<string, string> {
    let problemIdSet = new Set<string>();
    let problemPairs: [string, string][] = submissions
      .filter(s => resultToExtract.has(s.result) && userIds.has(s.user_id))
      .map(s => {
        let t: [string, string] = [s.problem_id, s.result];
        return t;
      });

    return new Map(problemPairs);
  }
}
