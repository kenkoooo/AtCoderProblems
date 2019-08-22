import React from "react";

import {isAccepted} from "../../utils";
import {BootstrapTable, TableHeaderColumn} from "react-bootstrap-table";
import * as Url from "../../utils/Url";
import Submission from "../../interfaces/Submission";
import Problem from "../../interfaces/Problem";
import {List, Map} from "immutable";
import Contest from "../../interfaces/Contest";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel
} from "../../interfaces/ProblemModel";
import {RatingInfo} from "../../utils/RatingInfo";
import {predictSolveProbability, predictSolveTime} from "../../utils/ProblemModelUtil";
import {Button, ButtonGroup, Row} from "reactstrap";

const RECOMMEND_NUM = 10;

type RecommendOption = "Easy" | "Moderate" | "Difficult";

function getRecommendProbability(option: RecommendOption): number {
  if (option === "Easy") {
    return 0.8;
  } else if (option === "Moderate") {
    return 0.5;
  } else { // Difficult
    return 0.2;
  }
}

interface Props {
  readonly userSubmissions: List<Submission>;
  readonly problems: List<Problem>;
  readonly contests: Map<string, Contest>;
  readonly problemModels: Map<string, ProblemModel>;
  readonly userRatingInfo: RatingInfo;
}

interface LocalState {
  recommendOption: RecommendOption;
}

class Recommendations extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      recommendOption: "Moderate"
    };
  }

  render(): React.ReactNode {
    const {userSubmissions, problems, contests, problemModels, userRatingInfo} = this.props;
    const {recommendOption} = this.state;

    if (userSubmissions.isEmpty()) {
      return null;
    }

    const acProblemIdSet = userSubmissions
      .filter(s => isAccepted(s.result))
      .map(s => s.problem_id)
      .toSet();
    const recommendingProbability = getRecommendProbability(recommendOption);

    const recommendedProblems = problems
      .filter(p => !acProblemIdSet.has(p.id))
      .filter(p => problemModels.has(p.id))
      .map(p => ({...p, difficulty: Math.round(problemModels.getIn([p.id, "difficulty"], 0))}))
      .map(p => {
        const internalRating = userRatingInfo.internalRating;
        let predictedSolveTime: number | null;
        let predictedSolveProbability: number;
        if (internalRating === null) {
          predictedSolveTime = null;
          predictedSolveProbability = -1;
        } else {
          // @ts-ignore
          const problemModel: ProblemModel = problemModels.get(p.id);
          if (isProblemModelWithTimeModel(problemModel)) {
            predictedSolveTime = predictSolveTime(problemModel, internalRating);
          } else {
            predictedSolveTime = null;
          }
          if (isProblemModelWithDifficultyModel(problemModel)) {
            predictedSolveProbability = predictSolveProbability(problemModel, internalRating);
          } else {
            predictedSolveProbability = -1;
          }
        }
        return {...p, predictedSolveTime, predictedSolveProbability};
      })
      .sort((a, b) => {
        const da = Math.abs(a.predictedSolveProbability - recommendingProbability);
        const db = Math.abs(b.predictedSolveProbability - recommendingProbability);
        return da - db;
      })
      .slice(0, RECOMMEND_NUM)
      .sort((a, b) => b.difficulty - a.difficulty)
      .toArray();

    return (<>
        <Row className="my-3">
          <ButtonGroup>
            <Button
              onClick={() => this.setState({ recommendOption: "Easy" })}
              active={recommendOption === "Easy"}
            >
              Easy (80%)
            </Button>
            <Button
              onClick={() => this.setState({ recommendOption: "Moderate" })}
              active={recommendOption === "Moderate"}
            >
              Moderate (50%)
            </Button>
            <Button
              onClick={() => this.setState({ recommendOption: "Difficult" })}
              active={recommendOption === "Difficult"}
            >
              Difficult (20%)
            </Button>
          </ButtonGroup>
        </Row>
        <Row className="my-3">
          <BootstrapTable
            data={recommendedProblems}
            keyField="id"
            height="auto"
            hover
            striped
          >
            <TableHeaderColumn
              dataField="title"
              dataFormat={(
                title: string,
                {id, contest_id}: { id: string; contest_id: string; }
              ) => (
                <a target="_blank" href={Url.formatProblemUrl(id, contest_id)}>
                  {title}
                </a>
              )}
            >
              Problem
            </TableHeaderColumn>
            <TableHeaderColumn
              dataField="contest_id"
              dataFormat={(contest_id: string, problem: Problem) => {
                const contest = contests.get(contest_id);
                return (
                  <a href={Url.formatContestUrl(problem.contest_id)} target="_blank">
                    {contest ? contest.title : contest_id}
                  </a>
                );
              }}
            >
              Contest
            </TableHeaderColumn>
            <TableHeaderColumn dataField="difficulty">Difficulty</TableHeaderColumn>
            <TableHeaderColumn
              dataField="predictedSolveTime"
              dataFormat={(predictedSolveTime: number | null) => {
                if (predictedSolveTime === null) {
                  return "-";
                } else if (predictedSolveTime < 30) {
                  return "<1 min";
                } else {
                  const minutes = Math.round(predictedSolveTime / 60);
                  return `${minutes} mins`;
                }
              }}
            >Median Solve Time</TableHeaderColumn>
          </BootstrapTable>
        </Row>
      </>
    );
  }
}

export default Recommendations;
