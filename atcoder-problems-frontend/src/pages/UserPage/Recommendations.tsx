import React, { useState } from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { List, Map as ImmutableMap } from "immutable";
import {
  Button,
  ButtonGroup,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledDropdown,
} from "reactstrap";
import { isAccepted } from "../../utils";
import * as Url from "../../utils/Url";
import Submission from "../../interfaces/Submission";
import Problem from "../../interfaces/Problem";
import Contest from "../../interfaces/Contest";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
} from "../../interfaces/ProblemModel";
import { RatingInfo } from "../../utils/RatingInfo";
import {
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
  predictSolveProbability,
  predictSolveTime,
} from "../../utils/ProblemModelUtil";
import { HelpBadgeTooltip } from "../../components/HelpBadgeTooltip";
import { ProblemLink } from "../../components/ProblemLink";
import { ContestLink } from "../../components/ContestLink";
import { NewTabLink } from "../../components/NewTabLink";
import { ProblemId } from "../../interfaces/Status";

const ExcludeOptions = [
  "Exclude",
  "Exclude submitted",
  "1 Week",
  "2 Weeks",
  "4 Weeks",
  "6 Months",
  "Don't exclude",
] as const;
type ExcludeOption = typeof ExcludeOptions[number];

const formatExcludeOption = (excludeOption: ExcludeOption): string => {
  switch (excludeOption) {
    case "1 Week":
      return "Exclude problems solved in last 7 days.";
    case "2 Weeks":
      return "Exclude problems solved in last 2 weeks.";
    case "4 Weeks":
      return "Exclude problems solved in last 4 weeks";
    case "6 Months":
      return "Exclude problems solved in last 6 months";
    case "Exclude":
      return "Exclude all the solved problems";
    case "Don't exclude":
      return "Don't exclude solved problems.";
    case "Exclude submitted":
      return "Exclude all the submitted problems";
  }
};

const isIncluded = (
  problemId: string,
  excludeOption: ExcludeOption,
  currentSecond: number,
  lastSolvedTimeMap: Map<ProblemId, number>
): boolean => {
  const lastSolvedTime = lastSolvedTimeMap.get(problemId);
  if (lastSolvedTime) {
    const seconds = currentSecond - lastSolvedTime;
    switch (excludeOption) {
      case "Exclude":
      case "Exclude submitted":
        return false;
      case "1 Week":
        return seconds > 3600 * 24 * 7;
      case "2 Weeks":
        return seconds > 3600 * 24 * 14;
      case "4 Weeks":
        return seconds > 3600 * 24 * 28;
      case "6 Months":
        return seconds > 3600 * 24 * 180;
      case "Don't exclude":
        return true;
    }
  } else {
    return true;
  }
};

const excludeSubmittedproblem = (
  problemId: string,
  excludeOption: ExcludeOption,
  submitted: { [_: string]: Array<number> }
): boolean => {
  switch (excludeOption) {
    case "Exclude submitted":
      return !(problemId in submitted);
    default:
      return true;
  }
};

const RECOMMEND_NUM_OPTIONS = [
  {
    text: "10",
    value: 10,
  },
  {
    text: "20",
    value: 20,
  },
  {
    text: "50",
    value: 50,
  },
  {
    text: "100",
    value: 100,
  },
  {
    text: "All",
    value: Number.POSITIVE_INFINITY,
  },
];

type RecommendOption = "Easy" | "Moderate" | "Difficult";

const getRecommendProbability = (option: RecommendOption): number => {
  switch (option) {
    case "Easy":
      return 0.8;
    case "Moderate":
      return 0.5;
    case "Difficult":
      return 0.2;
    default:
      return 0.0;
  }
};

const getRecommendProbabilityRange = (
  option: RecommendOption
): { lowerBound: number; upperBound: number } => {
  switch (option) {
    case "Easy":
      return {
        lowerBound: 0.5,
        upperBound: Number.POSITIVE_INFINITY,
      };
    case "Moderate":
      return {
        lowerBound: 0.2,
        upperBound: 0.8,
      };
    case "Difficult":
      return {
        lowerBound: Number.NEGATIVE_INFINITY,
        upperBound: 0.5,
      };
    default:
      return {
        lowerBound: Number.NEGATIVE_INFINITY,
        upperBound: Number.POSITIVE_INFINITY,
      };
  }
};

interface Props {
  readonly userSubmissions: Submission[];
  readonly problems: List<Problem>;
  readonly contests: ImmutableMap<string, Contest>;
  readonly problemModels: ImmutableMap<string, ProblemModel>;
  readonly userRatingInfo: RatingInfo;
}

export const Recommendations: React.FC<Props> = (props) => {
  const {
    userSubmissions,
    problems,
    contests,
    problemModels,
    userRatingInfo,
  } = props;

  const [recommendNum, setRecommendNum] = useState(10);
  const [recommendOption, setRecommendOption] = useState<RecommendOption>(
    "Moderate"
  );
  const [recommendExperimental, setRecommendExperimental] = useState(true);
  const [excludeOption, setExcludeOption] = useState<ExcludeOption>("Exclude");

  if (userSubmissions.length === 0) {
    return null;
  }
  const lastSolvedTimeMap = new Map<ProblemId, number>();
  userSubmissions
    .filter((s) => isAccepted(s.result))
    .forEach((s) => {
      const cur = lastSolvedTimeMap.get(s.problem_id) ?? 0;
      lastSolvedTimeMap.set(s.problem_id, Math.max(s.epoch_second, cur));
    });

  const recommendingProbability = getRecommendProbability(recommendOption);
  const recommendingRange = getRecommendProbabilityRange(recommendOption);

  const currentSecond = Math.floor(new Date().getTime() / 1000);
  const submittedProblemIdTable = userSubmissions
    .map((s) => s.problem_id)
    .reduce((m, a, i) => {
      m[a] = (m[a] || []).concat(i);
      return m;
    }, {} as { [_: string]: Array<number> });
  const recommendedProblems = problems
    .filter((p) =>
      isIncluded(p.id, excludeOption, currentSecond, lastSolvedTimeMap)
    )
    .filter((p) =>
      excludeSubmittedproblem(p.id, excludeOption, submittedProblemIdTable)
    )
    .filter((p) => problemModels.has(p.id))
    .map((p) => ({
      ...p,
      difficulty: problemModels.get(p.id)?.difficulty,
      is_experimental: problemModels.get(p.id)?.is_experimental ?? false,
    }))
    .filter((p) => recommendExperimental || !p.is_experimental)
    .filter((p) => p.difficulty !== undefined)
    .map((p) => {
      const internalRating = userRatingInfo.internalRating;
      let predictedSolveTime: number | null;
      let predictedSolveProbability: number;
      if (internalRating === null) {
        predictedSolveTime = null;
        predictedSolveProbability = -1;
      } else {
        const problemModel: ProblemModel | undefined = problemModels.get(p.id);
        if (isProblemModelWithTimeModel(problemModel)) {
          predictedSolveTime = predictSolveTime(problemModel, internalRating);
        } else {
          predictedSolveTime = null;
        }
        if (isProblemModelWithDifficultyModel(problemModel)) {
          predictedSolveProbability = predictSolveProbability(
            problemModel,
            internalRating
          );
        } else {
          predictedSolveProbability = -1;
        }
      }
      return { ...p, predictedSolveTime, predictedSolveProbability };
    })
    .sort((a, b) => {
      const da = Math.abs(
        a.predictedSolveProbability - recommendingProbability
      );
      const db = Math.abs(
        b.predictedSolveProbability - recommendingProbability
      );
      return da - db;
    })
    .filter(
      (p) =>
        recommendingRange.lowerBound <= p.predictedSolveProbability &&
        p.predictedSolveProbability < recommendingRange.upperBound
    )
    .slice(0, recommendNum)
    .sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0))
    .toArray();

  return (
    <>
      <Row className="my-3 d-flex justify-content-between">
        <div>
          <ButtonGroup>
            <Button
              onClick={(): void => setRecommendOption("Easy")}
              active={recommendOption === "Easy"}
            >
              Easy
            </Button>
            <Button
              onClick={(): void => setRecommendOption("Moderate")}
              active={recommendOption === "Moderate"}
            >
              Moderate
            </Button>
            <Button
              onClick={(): void => setRecommendOption("Difficult")}
              active={recommendOption === "Difficult"}
            >
              Difficult
            </Button>
          </ButtonGroup>
          <ButtonGroup className="mx-3">
            <Button
              onClick={(): void => setRecommendExperimental(true)}
              active={recommendExperimental}
            >
              Show
              <span role="img" aria-label="experimental">
                🧪
              </span>
            </Button>
            <Button
              onClick={(): void => setRecommendExperimental(false)}
              active={!recommendExperimental}
            >
              Hide
              <span role="img" aria-label="experimental">
                🧪
              </span>
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {formatExcludeOption(excludeOption)}
              </DropdownToggle>
              <DropdownMenu>
                {ExcludeOptions.map((option) => (
                  <DropdownItem
                    key={option}
                    onClick={(): void => setExcludeOption(option)}
                  >
                    {formatExcludeOption(option)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledDropdown>
          </ButtonGroup>
        </div>
        <UncontrolledDropdown direction="left">
          <DropdownToggle caret>
            {recommendNum === Number.POSITIVE_INFINITY ? "All" : recommendNum}
          </DropdownToggle>
          <DropdownMenu>
            {RECOMMEND_NUM_OPTIONS.map(({ text, value }) => (
              <DropdownItem
                key={value}
                onClick={(): void => setRecommendNum(value)}
              >
                {text}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </UncontrolledDropdown>
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
              {
                id,
                contest_id,
                is_experimental,
              }: { id: string; contest_id: string; is_experimental: boolean }
            ): React.ReactElement => (
              <ProblemLink
                isExperimentalDifficulty={is_experimental}
                showDifficulty={true}
                problemId={id}
                problemTitle={title}
                contestId={contest_id}
                problemModel={problemModels.get(id, null)}
                userRatingInfo={userRatingInfo}
              />
            )}
          >
            Problem
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="contest_id"
            dataFormat={(
              contestId: string,
              problem: Problem
            ): React.ReactElement => {
              const contest = contests.get(contestId);
              return contest ? (
                <ContestLink contest={contest} />
              ) : (
                <NewTabLink href={Url.formatContestUrl(problem.contest_id)}>
                  {contestId}
                </NewTabLink>
              );
            }}
          >
            Contest
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="difficulty"
            dataFormat={(difficulty: number | null): string => {
              if (difficulty === null) {
                return "-";
              }
              return String(difficulty);
            }}
          >
            <span>Difficulty</span>
            <HelpBadgeTooltip id="difficulty">
              Internal rating to have 50% Solve Probability
            </HelpBadgeTooltip>
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="predictedSolveProbability"
            dataFormat={formatPredictedSolveProbability}
          >
            <span>Solve Probability</span>
            <HelpBadgeTooltip id="probability">
              Estimated probability that you could solve this problem if you
              competed in the contest.
            </HelpBadgeTooltip>
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="predictedSolveTime"
            dataFormat={formatPredictedSolveTime}
          >
            <span>Median Solve Time</span>
            <HelpBadgeTooltip id="solvetime">
              Estimated time required to solve this problem.
            </HelpBadgeTooltip>
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    </>
  );
};
