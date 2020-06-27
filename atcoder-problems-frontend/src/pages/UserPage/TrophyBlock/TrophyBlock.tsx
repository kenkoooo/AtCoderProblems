import Octicon, { Verified } from "@primer/octicons-react";
import React, { useState, useMemo } from "react";
import { Table, Row, Col, ListGroup, ListGroupItem, Badge } from "reactstrap";
import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import ProblemModel from "../../../interfaces/ProblemModel";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import { generateACCountTrophies } from "./ACCountTrophyGenerator";
import { generateACProblemsTrophies } from "./ACProblemsTrophyGenerator";
import { generateStreakTrophies } from "./StreakTrophyGenerator";
import { generateCompleteContestTrophies } from "./CompleteContestTrophyGenerator";
import { Trophy, TrophyGroup } from "./Trophy";

interface Props {
  submissions: Submission[];
  problemModels: Map<ProblemId, ProblemModel>;
  contests: Map<string, Contest>;
  contestToProblems: Map<ContestId, Problem[]>;
}

export const TrophyBlock = (props: Props): JSX.Element => {
  const { submissions, problemModels, contests, contestToProblems } = props;
  const trophySubmissions = submissions.map((submission) => {
    const problemModel = problemModels.get(submission.problem_id);
    return { submission, problemModel };
  });

  const trophies = [] as Trophy[];
  trophies.push(...generateStreakTrophies(trophySubmissions));
  trophies.push(...generateACCountTrophies(trophySubmissions));
  trophies.push(...generateACProblemsTrophies(trophySubmissions));
  trophies.push(
    ...generateCompleteContestTrophies(
      trophySubmissions,
      contests,
      contestToProblems
    )
  );

  const [filterGroup, setFilterGroup] = useState<TrophyGroup | null>(null);
  const filteredTrophies = useMemo(
    () =>
      trophies
        .sort((a, b) => a.sortId.localeCompare(b.sortId))
        .filter((t) => filterGroup === null || t.group === filterGroup)
        .filter((t) => t.achieved),
    [trophies, filterGroup]
  );

  const totalTrophies = useMemo(
    () => trophies.filter((t) => t.achieved).length,
    [trophies]
  );
  const groupChoices: [TrophyGroup | null, string, number][] = useMemo(
    () => [
      [null, "All", trophies.filter((t) => t.achieved).length],
      ...Object.values(TrophyGroup)
        .sort((a, b) => a.localeCompare(b))
        .map(
          (group) =>
            [
              group,
              group,
              trophies.filter((t) => t.achieved && t.group === group).length,
            ] as [TrophyGroup, string, number]
        ),
    ],
    [trophies]
  );

  return (
    <>
      <Row className="my-2">
        <h2>{totalTrophies} Trophies</h2>
      </Row>
      <Row>
        <Col md="12" lg="3" className="mb-3">
          <ListGroup>
            {groupChoices.map(([group, description, count]) => (
              <ListGroupItem
                key={description}
                tag="button"
                action
                active={filterGroup === group}
                onClick={() => setFilterGroup(group)}
              >
                {description} <Badge pill>{count}</Badge>
              </ListGroupItem>
            ))}
          </ListGroup>
        </Col>
        <Col md="12" lg="9">
          <Table striped hover>
            <tbody>
              {filteredTrophies.map(({ sortId, title, group, reason }) => (
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
        </Col>
      </Row>
    </>
  );
};
