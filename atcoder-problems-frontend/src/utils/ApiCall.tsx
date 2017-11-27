import * as request from "superagent";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { MergedProblem } from "../model/MergedProblem";

export class ApiCall {
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

  static getProblems(url: string): Promise<Array<Problem>> {
    return this.getJson(url).then((obj: Array<any>) => {
      let problems: Problem[] = obj.map(o => {
        let p = { id: o["id"], title: o["title"], contestId: o["contest_id"] };
        return p;
      });
      return problems;
    });
  }

  static getContests(url: string): Promise<Array<Contest>> {
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
    query?: { user: string; rivals: string[] }
  ): Promise<Array<Submission>> {
    return this.getJson(url, query).then((obj: Array<any>) => {
      let submisssions: Submission[] = obj.map(o => {
        return {
          point: o["point"],
          result: o["result"],
          problem_id: o["problem_id"],
          user_id: o["user_id"],
          epoch_second: o["epoch_second"],
          id: o["id"],
          language: o["language"],
          length: o["length"],
          execution_time: o["execution_time"]
        };
      });
      return submisssions;
    });
  }

  static getMergedProblems(
    url: string,
    query?: { user: string; rivals: string[] }
  ): Promise<Array<MergedProblem>> {
    return this.getJson(url, query).then((obj: Array<any>) => {
      let problems: MergedProblem[] = obj.map(o => {
        return {
          first_submission_id: o["first_submission_id"],
          solver_count: o["solver_count"],
          fastest_user_id: o["fastest_user_id"],
          execution_time: o["execution_time"],
          shortest_user_id: o["shortest_user_id"],
          shortest_submission_id: o["shortest_submission_id"],
          contest_id: o["contest_id"],
          id: o["id"],
          fastest_submission_id: o["fastest_submission_id"],
          first_user_id: o["first_user_id"],
          title: o["title"],
          source_code_length: o["source_code_length"]
        };
      });
      return problems;
    });
  }
}
