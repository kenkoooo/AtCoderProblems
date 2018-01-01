import * as request from "superagent";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { RankPair } from "../model/RankPair";
import { MergedProblem } from "../model/MergedProblem";
import { Ranking } from "../components/Ranking";
import { LangCount } from "../model/LangCount";

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
      let problems: Problem[] = obj.map(o => o as Problem);
      return problems;
    });
  }

  static getRanking(kind: string): Promise<Array<RankPair>> {
    let url = `${this.BaseUrl}/info/${kind}`;
    return this.getJson(url).then((obj: Array<any>) => {
      let ranks = obj.map(o => {
        let p = { rank: 1, user_id: o["user_id"], count: o["problem_count"] };
        return p;
      });

      return this.fixRanking(ranks);
    });
  }

  static getRatedPointSumRanking(): Promise<Array<RankPair>> {
    let url = `${this.BaseUrl}/info/sums`;
    return this.getJson(url).then((obj: Array<any>) => {
      let ranks = obj.map(o => {
        let p = { rank: 1, user_id: o["user_id"], count: o["point_sum"] };
        return p;
      });

      return this.fixRanking(ranks);
    });
  }

  static fixRanking(ranks: Array<RankPair>): Array<RankPair> {
    ranks.sort((a, b) => b.count - a.count);

    for (let i = 1; i < ranks.length; i += 1) {
      if (ranks[i - 1].count == ranks[i].count) {
        ranks[i].rank = ranks[i - 1].rank;
      } else {
        ranks[i].rank = i + 1;
      }
    }

    return ranks;
  }

  static getContests(): Promise<Array<Contest>> {
    let url = `${this.BaseUrl}/info/contests`;
    return this.getJson(url).then((obj: Array<any>) => {
      let contests: Contest[] = obj.map(o => o as Contest);
      return contests;
    });
  }

  static getSubmissions(
    url: string,
    query?: { user: string; rivals: string }
  ): Promise<Array<Submission>> {
    return this.getJson(url, query).then((obj: Array<any>) => {
      let submissions: Submission[] = obj.map(o => o as Submission);
      return submissions;
    });
  }

  static getMergedProblems(): Promise<Array<MergedProblem>> {
    let url = `${this.BaseUrl}/info/merged-problems`;
    return this.getJson(url).then((obj: Array<any>) => {
      let problems: MergedProblem[] = obj.map(o => o as MergedProblem);
      return problems;
    });
  }

  static getLanguageCounts(): Promise<Array<LangCount>> {
    let url = `${this.BaseUrl}/info/lang`;
    return this.getJson(url).then((obj: Array<any>) => {
      let counts: LangCount[] = obj.map(o => o as LangCount);
      return counts;
    });
  }
}
