import React from "react";
import { Row, Col } from "reactstrap";
import Contest from "../../../interfaces/Contest";
import Problem from "../../../interfaces/Problem";
import ProblemModel from "../../../interfaces/ProblemModel";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import { groupBy } from "../../../utils/GroupBy";
import { generateACCountTrophies } from "./ACCountTrophyGenerator";
import { generateACProblemsTrophies } from "./ACProblemsTrophyGenerator";
import { generateStreakTrophies } from "./StreakTrophyGenerator";
import { generateCompleteContestTrophies } from "./CompleteContestTrophyGenerator";
import { Trophy, TrophyGroup } from "./Trophy";
import { TrophySubgroup } from "./TrophySubgroup";

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

  const sortedTrophies = trophies.sort((a, b) =>
    a.sortId.localeCompare(b.sortId)
  );
  const groupedTrophies: [TrophyGroup, [string, Trophy[]][]][] = Array.from(
    groupBy(sortedTrophies, (t) => t.group).entries()
  ).map(([group, trophies]) => [
    group,
    Array.from(groupBy(trophies, (t) => t.subgroup).entries()),
  ]);

  const achievedIds = new Set(
    trophies.filter((t) => t.achieved).map((t) => t.sortId)
  );

  return (
    <>
      <Row className="my-2">
        <h2>{achievedIds.size} Trophies</h2>
      </Row>
      {groupedTrophies.map(([group, subgroupedTrophies]) => (
        <Row key={`trophy-group-${group.replace(/[ #]/g, "-")}`}>
          <Col>
            <h3>{group}</h3>
            {subgroupedTrophies.map(([subgroup, trophies]) => (
              <TrophySubgroup
                key={`trophy-subgroup-${subgroup.replace(/[ #]/g, "-")}`}
                achievedIds={achievedIds}
                title={subgroup}
                trophies={trophies}
              />
            ))}
          </Col>
        </Row>
      ))}
    </>
  );
};
