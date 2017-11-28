import * as React from "react";
import { PageHeader, Row } from "react-bootstrap";
import { UserPagePieChart } from "./UserPagePieChart";
import { UserPageTable } from "./UserPageTable";
import { UserPageLineChart } from "./UserPageLineChart";
import { UserPageBarChart } from "./UserPageBarChart";
import { UserSearchForm } from "./UserSearchForm";
import { Submission } from "../model/Submission";
import { Problem } from "../model/Problem";

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
    let acceptedProblemSet = new Set(
      acceptedSubmissions.map(s => s.problem_id)
    );

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

        <PageHeader>Climbing</PageHeader>
        <UserPageLineChart acceptedSubmissions={acceptedSubmissions} />

        <PageHeader>Daily Effort</PageHeader>
        <UserPageBarChart acceptedSubmissions={acceptedSubmissions} />

        <PageHeader>Submissions</PageHeader>
        <UserPageTable submissions={this.props.submissions} />
      </Row>
    );
  }
}
