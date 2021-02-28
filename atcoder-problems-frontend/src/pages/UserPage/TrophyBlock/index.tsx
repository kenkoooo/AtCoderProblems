import Octicon, { Verified } from "@primer/octicons-react";
import React, { useState } from "react";
import { Table, Row, Col, ListGroup, ListGroupItem, Badge } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { List, Map as ImmutableMap } from "immutable";
import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import ProblemModel from "../../../interfaces/ProblemModel";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import * as CachedApiClient from "../../../utils/CachedApiClient";
import { convertMap } from "../../../utils/ImmutableMigration";
import { generateACCountTrophies } from "./ACCountTrophyGenerator";
import { generateACProblemsTrophies } from "./ACProblemsTrophyGenerator";
import { generateStreakTrophies } from "./StreakTrophyGenerator";
import { generateCompleteContestTrophies } from "./CompleteContestTrophyGenerator";
import { Trophy, TrophyGroup, TrophyGroups } from "./Trophy";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  submissionsFetch: PromiseState<List<Submission>>;
  problemModelsFetch: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
  contestMapFetch: PromiseState<ImmutableMap<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<ImmutableMap<ContestId, List<Problem>>>;
}

const InnerTrophyBlock: React.FC<InnerProps> = (props) => {
  const submissions = props.submissionsFetch.fulfilled
    ? props.submissionsFetch.value.toArray()
    : [];
  const problemModels = props.problemModelsFetch.fulfilled
    ? props.problemModelsFetch.value
    : ImmutableMap<ProblemId, ProblemModel>();
  const contestMap = props.contestMapFetch.fulfilled
    ? convertMap(props.contestMapFetch.value)
    : new Map<ContestId, Contest>();
  const contestToProblems = props.contestToProblemsFetch.fulfilled
    ? convertMap(
        props.contestToProblemsFetch.value.map((list) => list.toArray())
      )
    : new Map<ContestId, Problem[]>();

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
      contestMap,
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
                  <th className="text-success">
                    {achieved && <Octicon icon={Verified} />}
                  </th>
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

export const TrophyBlock = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: CachedApiClient.cachedSubmissions(userId),
  },
  problemModelsFetch: {
    value: CachedApiClient.cachedProblemModels(),
  },
  contestMapFetch: {
    value: CachedApiClient.cachedContestMap(),
  },
  contestToProblemsFetch: {
    value: CachedApiClient.cachedContestToProblemMap(),
  },
}))(InnerTrophyBlock);
