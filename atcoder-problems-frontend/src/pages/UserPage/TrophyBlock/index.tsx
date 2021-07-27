import { GoVerified } from "react-icons/go";
import React, { useState } from "react";
import { Table, Row, Col, ListGroup, ListGroupItem, Badge } from "reactstrap";
import {
  useContestMap,
  useContestToProblems,
  useProblemModelMap,
  useUserSubmission,
} from "../../../api/APIClient";
import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import { ContestId } from "../../../interfaces/Status";
import { generateACCountTrophies } from "./ACCountTrophyGenerator";
import { generateACProblemsTrophies } from "./ACProblemsTrophyGenerator";
import { generateStreakTrophies } from "./StreakTrophyGenerator";
import { generateCompleteContestTrophies } from "./CompleteContestTrophyGenerator";
import { Trophy, TrophyGroup, TrophyGroups } from "./Trophy";

interface OuterProps {
  userId: string;
}

export const TrophyBlock: React.FC<OuterProps> = (props) => {
  const submissions = useUserSubmission(props.userId) ?? [];
  const problemModels = useProblemModelMap();
  const contestMap = useContestMap();
  const contestToProblems =
    useContestToProblems() ?? new Map<ContestId, Problem[]>();

  const trophySubmissions = submissions.map((submission) => {
    const problemModel = problemModels?.get(submission.problem_id);
    return { submission, problemModel };
  });

  const trophies = [] as Trophy[];
  trophies.push(...generateStreakTrophies(trophySubmissions));
  trophies.push(...generateACCountTrophies(trophySubmissions));
  trophies.push(...generateACProblemsTrophies(trophySubmissions));
  trophies.push(
    ...generateCompleteContestTrophies(
      trophySubmissions,
      contestMap ?? new Map<ContestId, Contest>(),
      contestToProblems
    )
  );

  const [filterGroup, setFilterGroup] = useState<TrophyGroup | "All">("All");
  const filteredTrophies = trophies
    .sort((a, b) => a.sortId.localeCompare(b.sortId))
    .filter((t) => filterGroup === "All" || t.group === filterGroup);

  const groupChoices: [TrophyGroup | "All", number][] = [
    ["All", trophies.filter((t) => t.achieved).length],
    ...TrophyGroups.map(
      (group) =>
        [
          group,
          trophies.filter((t) => t.group === group && t.achieved).length,
        ] as [TrophyGroup, number]
    ),
  ];

  return (
    <>
      <Row className="my-2">
        <h2>{trophies.length} Trophies</h2>
      </Row>
      <Row>
        <Col md="12" lg="3" className="mb-3">
          <ListGroup>
            {groupChoices.map(([group, count]) => (
              <ListGroupItem
                key={group}
                tag="button"
                action
                active={filterGroup === group}
                onClick={() => setFilterGroup(group)}
              >
                {group} <Badge pill>{count}</Badge>
              </ListGroupItem>
            ))}
          </ListGroup>
        </Col>
        <Col md="12" lg="9">
          <Table striped hover>
            <tbody>
              {filteredTrophies.map(({ sortId, title, reason, achieved }) => (
                <tr key={sortId}>
                  <th className="text-success">{achieved && <GoVerified />}</th>
                  <td>
                    <b>{achieved ? title : "???"}</b>
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
