import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";

export class UrlFormatter {
    private static BaseUrl = "https://beta.atcoder.jp";
    static contestUrl(contest: Contest): string {
        return `${this.BaseUrl}/contests/${contest.id}/`;
    }

    static problemUrl(contest: Contest, problem: Problem): string {
        return `${this.BaseUrl}/contests/${contest.id}/tasks/${problem.id}`;
    }
}