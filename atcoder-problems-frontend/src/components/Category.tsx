import * as React from "react";
import { Table, Grid } from "react-bootstrap";
import { CategoryOneBlock } from "./CategoryOneBlock";
import { CategorySmallBlock } from "./CategorySmallBlock";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { SubmissionUtils } from "../utils/SubmissionUtils";

export interface CategoryProps {
  problems: Array<Problem>;
  contests: Array<Contest>;
  userId: string;
  rivals: Array<string>;
  acceptedProblems: Set<string>;
  wrongMap: Map<string, string>;
  rivalProblems: Set<string>;
}

export class Category extends React.Component<CategoryProps, {}> {
  private filterProblems(
    problemMap: Map<string, Array<Problem>>,
    regexp: RegExp
  ): Array<[Contest, Array<Problem>]> {
    return this.props.contests
      .filter(contest => contest.id.match(regexp))
      .sort((a, b) => a.id.localeCompare(b.id))
      .reverse()
      .filter(contest => problemMap.has(contest.id))
      .map(contest => {
        let problems = problemMap
          .get(contest.id)
          .sort((a, b) => a.id.localeCompare(b.id));
        let r: [Contest, Array<Problem>] = [contest, problems];
        return r;
      });
  }

  render() {
    let problemMap = new Map<string, Array<Problem>>();
    this.props.contests.forEach(contest => problemMap.set(contest.id, []));
    this.props.problems
      .filter(problem => problemMap.has(problem.contest_id))
      .forEach(problem => problemMap.get(problem.contest_id).push(problem));

    // filter problems of AtCoder official contests
    let agc = this.filterProblems(problemMap, /^agc\d{3}$/);
    let abc = this.filterProblems(problemMap, /^abc\d{3}$/);
    let arc = this.filterProblems(problemMap, /^arc\d{3}$/);

    // sync
    abc.forEach((v, i) => {
      let j = arc.findIndex(
        t => t[0].start_epoch_second == v[0].start_epoch_second
      );
      if (j >= 0) {
        let w = arc[j];
        let merged = v[1].concat(w[1]).sort((a, b) => a.id.localeCompare(b.id));
        abc[i] = [v[0], merged.slice(0, 4)];
        arc[j] = [w[0], merged.slice(2)];
      }
    });

    // problems of other contests
    let others = this.filterProblems(problemMap, /^(?!a[rgb]c\d{3}).*$/).sort(
      (a, b) => {
        return b[0].start_epoch_second - a[0].start_epoch_second;
      }
    );

    let acceptedProblems = this.props.acceptedProblems;
    let wrongProblemMap = this.props.wrongMap;
    let rivalProblems = this.props.rivalProblems;

    return (
      <Grid>
        <CategoryOneBlock
          categoryTitle="AtCoder Grand Contest"
          data={agc}
          header={"ABCDEF".split("")}
          acceptedProblems={acceptedProblems}
          wrongMap={wrongProblemMap}
          rivalProblems={rivalProblems}
        />
        <CategoryOneBlock
          categoryTitle="AtCoder Beginner Contest"
          data={abc}
          header={"ABCD".split("")}
          acceptedProblems={acceptedProblems}
          wrongMap={wrongProblemMap}
          rivalProblems={rivalProblems}
        />
        <CategoryOneBlock
          categoryTitle="AtCoder Regular Contest"
          data={arc}
          header={"ABCD".split("")}
          acceptedProblems={acceptedProblems}
          wrongMap={wrongProblemMap}
          rivalProblems={rivalProblems}
          rightJustified
        />
        <CategorySmallBlock
          data={others}
          acceptedProblems={acceptedProblems}
          wrongMap={wrongProblemMap}
          rivalProblems={rivalProblems}
        />
      </Grid>
    );
  }
}
