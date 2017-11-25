import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";

export class UrlFormatter {
    static contestUrl(contest: Contest): string {
        return `https://beta.atcoder.jp/contests/${contest.id}/`;
    }

    static problemUrl(contest: Contest, problem: Problem): string {
        return `https://beta.atcoder.jp/contests/${contest.id}/tasks/${problem.id}`;
    }
}