import * as request from "superagent";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { RankPair } from "../model/RankPair";
import { MergedProblem } from "../model/MergedProblem";
import { RankingKind } from "../model/RankingKind";

export class ApiCall {
  static BaseUrl = "./atcoder-api";

  static getJson(url: string, query?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      request
        .get(url)
        .query(query)
        .set("Content-Type", "application/json")
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.body);
          }
        });
    });
  }

  static getProblems(): Promise<Array<Problem>> {
    let url = `${this.BaseUrl}/info/problems`;
    return this.getJson(url).then((obj: Array<any>) => {
      let problems: Problem[] = obj.map(o => {
        let p = { id: o["id"], title: o["title"], contestId: o["contest_id"] };
        return p;
      });
      return problems;
    });
  }

  static getRanking(kind: string): Promise<Array<RankPair>> {
    let url = `${this.BaseUrl}/info/${kind}`;
    return this.getJson(url).then((obj: Array<any>) => {
      let ranks = obj.map(o => {
        let p = { rank: 1, userId: o["user_id"], count: o["problem_count"] };
        return p;
      });
      ranks.sort((a, b) => b.count - a.count);

      for (let i = 1; i < ranks.length; i += 1) {
        if (ranks[i - 1].count == ranks[i].count) {
          ranks[i].rank = ranks[i - 1].rank;
        } else {
          ranks[i].rank = i + 1;
        }
      }

      return ranks;
    });
  }

  static getContests(): Promise<Array<Contest>> {
    let url = `${this.BaseUrl}/info/contests`;
    return this.getJson(url).then((obj: Array<any>) => {
      let contests: Contest[] = obj.map(o => {
        return {
          id: o["id"],
          title: o["title"],
          start_epoch_second: o["start_epoch_second"]
        };
      });
      return contests;
    });
  }

  static getSubmissions(
    url: string,
    query?: { user: string; rivals: string }
  ): Promise<Array<Submission>> {
    return this.getJson(url, query).then((obj: Array<any>) => {
      let submissions: Submission[] = obj.map(o => {
        return {
          point: o["point"],
          result: o["result"],
          problem_id: o["problem_id"],
          user_id: o["user_id"],
          epoch_second: o["epoch_second"],
          id: o["id"],
          language: o["language"],
          length: o["length"],
          contestId: o["contest_id"],
          execution_time: o["execution_time"]
        };
      });
      return submissions;
    });
  }

  static getMergedProblems(): Promise<Array<MergedProblem>> {
    let url = `${this.BaseUrl}/info/merged-problems`;
    return this.getJson(url).then((obj: Array<any>) => {
      let problems: MergedProblem[] = obj.map(o => {
        return {
          first_submission_id: o["first_submission_id"],
          solver_count: o["solver_count"],
          fastest_user_id: o["fastest_user_id"],
          execution_time: o["execution_time"],
          shortest_user_id: o["shortest_user_id"],
          shortest_submission_id: o["shortest_submission_id"],
          contestId: o["contest_id"],
          id: o["id"],
          fastest_submission_id: o["fastest_submission_id"],
          first_user_id: o["first_user_id"],
          title: o["title"],
          source_code_length: o["source_code_length"],
          fastest_contest_id: o["fastest_contest_idw"],
          shortest_contest_id: o["shortest_contest_id"],
          first_contest_id: o["first_contest_id"],
          point: o["point"],
          predict: o["predict"]
        };
      });
      return problems;
    });
  }
}
