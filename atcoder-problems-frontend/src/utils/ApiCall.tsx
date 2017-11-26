import * as request from "superagent";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";

export class ApiCall {
  static getJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      request
        .get(url)
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
        return { id: o["id"], title: o["title"], contestId: o["contest_id"] };
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

  static getSubmissions(url: string): Promise<Array<Submission>> {
    return this.getJson(url).then((obj: Array<any>) => {
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
}
