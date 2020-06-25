import Octicon, { Verified } from "@primer/octicons-react";
import React from "react";
import { Table, Row } from "reactstrap";
import ProblemModel from "../../../interfaces/ProblemModel";
import { ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import { generateACCountTrophies } from "./ACCountTrophyGenerator";
import { generateACProblemsTrophies } from "./ACProblemsTrophyGenerator";
import { generateStreakTrophies } from "./StreakTrophyGenerator";
import { Trophy } from "./Trophy";

interface Props {
  submissions: Submission[];
  problemModels: Map<ProblemId, ProblemModel>;
}

export const TrophyBlock = (props: Props): JSX.Element => {
  const { submissions, problemModels } = props;
  const trophySubmissions = submissions.map((submission) => {
    const problemModel = problemModels.get(submission.problem_id);
    return { submission, problemModel };
  });

  const trophies = [] as Trophy[];
  trophies.push(...generateStreakTrophies(trophySubmissions));
  trophies.push(...generateACCountTrophies(trophySubmissions));
  trophies.push(...generateACProblemsTrophies(trophySubmissions));

  const filteredTrophies = trophies
    .sort((a, b) => a.sortId.localeCompare(b.sortId))
    .filter((t) => t.achieved);
  return (
    <>
      <Row className="my-2">
        <h2>{filteredTrophies.length} Trophies</h2>
      </Row>
      <Row>
        <Table striped hover>
          <tbody>
            {filteredTrophies.map(({ sortId, title, reason }) => (
              <tr key={sortId}>
                <th className="text-success">
                  <Octicon icon={Verified} />
                </th>
                <td>
                  <b>{title}</b>
                </td>
                <td>{reason}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
    </>
  );
};
