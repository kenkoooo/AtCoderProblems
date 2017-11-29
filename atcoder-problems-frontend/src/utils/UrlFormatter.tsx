import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";
import { Submission } from "../model/Submission";

export class UrlFormatter {
  private static BaseUrl = "https://beta.atcoder.jp";
  static contestUrl(contestId: string): string {
    return `${this.BaseUrl}/contests/${contestId}/`;
  }

  static problemUrl(contestId: string, problemId: string): string {
    return `${this.BaseUrl}/contests/${contestId}/tasks/${problemId}`;
  }

  static submissionUrl(contest: string, submissionId: number): string {
    return `${this.BaseUrl}/contests/${contest}/submissions/${submissionId}`;
  }

  static solverUrl(contest: Contest, problem: Problem): string {
    return `${this.BaseUrl}/contests/${contest.id}/submissions/?f.Task=${
      problem.id
    }&f.Status=AC`;
  }
}
