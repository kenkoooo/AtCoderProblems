import * as React from "react";
import { PageHeader, Row } from "react-bootstrap";
import { UserPagePieChart } from "./UserPagePieChart";
import { UserPageTable } from "./UserPageTable";
import { UserPageLineChart } from "./UserPageLineChart";
import { UserPageBarChart } from "./UserPageBarChart";
import { UserSearchForm } from "./UserSearchForm";
import { Submission } from "../model/Submission";
import { Problem } from "../model/Problem";
import { UserPageAchievements } from "./UserPageAchievements";
import { TimeFormatter } from "../utils/TimeFormatter";
import { UserPageHeatMap } from "./UserPageHeatMap";
import { UserPageLanguages } from "./UserPageLanguages";

export interface UserPageProps {
  userId: string;
  submissions: Array<Submission>;
  problems: Array<Problem>;
}

export class UserPage extends React.Component<UserPageProps, {}> {
  render() {
    let count = {
      beginner: Array.from({ length: 4 }, _ => ({ accepted: 0, total: 0 })),
      regular: Array.from({ length: 4 }, _ => ({ accepted: 0, total: 0 })),
      grand: Array.from({ length: 6 }, _ => ({ accepted: 0, total: 0 }))
    };

    let acceptedSubmissions = this.props.submissions.filter(
      s => s.result === "AC"
    );
    let acceptedProblemSet = new Set();
    let acceptNewProblemSeconds = acceptedSubmissions
      .sort((a, b) => a.epoch_second - b.epoch_second)
      .filter(s => {
        if (acceptedProblemSet.has(s.problem_id)) {
          return false;
        } else {
          acceptedProblemSet.add(s.problem_id);
          return true;
        }
      })
      .map(s => s.epoch_second);

    this.props.problems
      .filter(problem => problem.contestId.match(/^a[rgb]c\d{3}$/))
      .forEach(problem => {
        // get problem id
        let c = problem.id.slice(-1);
        // in old contests, problem id format was like "arcXXX_1",
        // but the format is like "arcXXX_a" in the newest one
        let id = c.match(/\d/) ? Number(c) - 1 : "abcdef".split("").indexOf(c);

        let contestPrefix = problem.id.slice(0, 3);
        let isAccepted = acceptedProblemSet.has(problem.id);
        switch (contestPrefix) {
          case "abc":
            count.beginner[id].total += 1;
            if (isAccepted) count.beginner[id].accepted += 1;
            break;
          case "arc":
            count.regular[id].total += 1;
            if (isAccepted) count.regular[id].accepted += 1;
            break;
          case "agc":
            count.grand[id].total += 1;
            if (isAccepted) count.grand[id].accepted += 1;
            break;
          default:
            break;
        }
      });

    return (
      <Row>
        <Row>
          <UserSearchForm userId={this.props.userId} />
        </Row>
        <PageHeader>{this.props.userId}</PageHeader>
        <UserPageAchievements
          userId={this.props.userId}
          acceptNewProblemSeconds={acceptNewProblemSeconds}
        />

        <PageHeader>AtCoder Beginner Contest</PageHeader>
        <Row>
          {"ABCD"
            .split("")
            .map((c, i) => (
              <UserPagePieChart
                name={`abc_${c}`}
                title={`Problem ${c}`}
                totalCount={count.beginner[i].total}
                acceptedCount={count.beginner[i].accepted}
              />
            ))}
        </Row>

        <PageHeader>AtCoder Regular Contest</PageHeader>
        <Row>
          {"ABCD"
            .split("")
            .map((c, i) => (
              <UserPagePieChart
                name={`arc_${c}`}
                title={`Problem ${c}`}
                totalCount={count.regular[i].total}
                acceptedCount={count.regular[i].accepted}
              />
            ))}
        </Row>

        <PageHeader>AtCoder Grand Contest</PageHeader>
        <Row>
          {"ABCDEF"
            .split("")
            .map((c, i) => (
              <UserPagePieChart
                name={`agc_${c}`}
                title={`Problem ${c}`}
                columnGrids={2}
                height={170}
                width={170}
                totalCount={count.grand[i].total}
                acceptedCount={count.grand[i].accepted}
              />
            ))}
        </Row>

        <PageHeader>Heatmap</PageHeader>
        <UserPageHeatMap submissions={this.props.submissions} />

        <PageHeader>Climbing</PageHeader>
        <UserPageLineChart acceptNewProblemSeconds={acceptNewProblemSeconds} />

        <PageHeader>Daily Effort</PageHeader>
        <UserPageBarChart acceptNewProblemSeconds={acceptNewProblemSeconds} />

        <PageHeader>Submissions</PageHeader>
        <UserPageTable
          submissions={this.props.submissions}
          problems={this.props.problems}
        />

        <PageHeader>Languages</PageHeader>
        <UserPageLanguages userId={this.props.userId} />
      </Row>
    );
  }
}
