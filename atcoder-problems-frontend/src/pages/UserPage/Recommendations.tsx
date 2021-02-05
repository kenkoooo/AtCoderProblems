import React, { useState } from "react";
import {
  BootstrapTable,
  SelectRow,
  SelectRowMode,
  TableHeaderColumn,
} from "react-bootstrap-table";
import { List, Map as ImmutableMap } from "immutable";
import {
  Button,
  ButtonGroup,
  CustomInput,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
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

interface CommonProps {
  readonly problems: List<Problem>;
  readonly contests: ImmutableMap<string, Contest>;
  readonly problemModels: ImmutableMap<string, ProblemModel>;
  readonly userRatingInfo: RatingInfo;
  readonly isLoggedIn?: boolean;
}

interface Props extends CommonProps {
  readonly userSubmissions: Submission[];
}

interface TableProps extends CommonProps {
  readonly lastSolvedTimeMap: Map<ProblemId, number>;
  readonly submittedSet: Set<ProblemId>;
}

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

const excludeSubmittedProblem = (
  problemId: ProblemId,
  excludeOption: ExcludeOption,
  submitted: Set<ProblemId>
): boolean => {
  switch (excludeOption) {
    case "Exclude submitted":
      return !submitted.has(problemId);
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

const RecommendOptions = ["Easy", "Moderate", "Difficult"] as const;
type RecommendOption = typeof RecommendOptions[number];

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

const useProblemIdSet = (): [
  Set<ProblemId>,
  {
    addProblemIds: (ids: ProblemId[]) => void;
    deleteProblemIds: (ids: ProblemId[]) => void;
    clear: () => void;
  }
] => {
  const [problemIdSet, setProblemIdSet] = React.useState(new Set<ProblemId>());

  const addProblemIds = React.useCallback(
    (ids: ProblemId[]) =>
      setProblemIdSet((prev) => {
        const newProblemIdSet = prev;
        for (const id of ids) {
          newProblemIdSet.add(id);
        }
        return newProblemIdSet;
      }),
    []
  );
  const deleteProblemIds = React.useCallback(
    (ids: ProblemId[]) =>
      setProblemIdSet((prev) => {
        const newProblemIdSet = prev;
        for (const id of ids) {
          newProblemIdSet.delete(id);
        }
        return newProblemIdSet;
      }),
    []
  );
  const clear = React.useCallback(
    () => setProblemIdSet(new Set<ProblemId>()),
    []
  );

  return [problemIdSet, { addProblemIds, deleteProblemIds, clear }];
};

const RecommendationTable: React.FC<TableProps> = (props) => {
  const {
    problems,
    contests,
    problemModels,
    userRatingInfo,
    lastSolvedTimeMap,
    submittedSet,
  } = props;

  const [recommendOption, setRecommendOption] = useState<RecommendOption>(
    "Moderate"
  );
  const [recommendExperimental, setRecommendExperimental] = useState(true);
  const [excludeOption, setExcludeOption] = useState<ExcludeOption>("Exclude");
  const [recommendNum, setRecommendNum] = useState(10);

  const [selectedProblemIdSet, updateSelectedProblemIdSet] = useProblemIdSet();

  const currentSecond = Math.floor(new Date().getTime() / 1000);

  const recommendingProbability = getRecommendProbability(recommendOption);
  const recommendingRange = getRecommendProbabilityRange(recommendOption);

  const recommendedProblems = problems
    .filter((p) =>
      isIncluded(p.id, excludeOption, currentSecond, lastSolvedTimeMap)
    )
    .filter((p) => excludeSubmittedProblem(p.id, excludeOption, submittedSet))
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

  interface HasProblemId {
    id: ProblemId;
  }
  const selectRowProps = !props.isLoggedIn
    ? undefined
    : ({
        mode: "checkbox" as SelectRowMode,
        selected: Array.from(selectedProblemIdSet),
        onSelect: (row: HasProblemId, isSelected) => {
          if (isSelected) {
            updateSelectedProblemIdSet.addProblemIds([row.id]);
          } else {
            updateSelectedProblemIdSet.deleteProblemIds([row.id]);
          }
        },
        onSelectAll: (isSelected, rows: HasProblemId[]) => {
          const ids = rows.map(({ id }) => id);
          if (isSelected) {
            updateSelectedProblemIdSet.addProblemIds(ids);
          } else {
            updateSelectedProblemIdSet.deleteProblemIds(ids);
          }
          return Array.from(selectedProblemIdSet);
        },
      } as SelectRow);

  const isLoggedInDevelop = true;

  return (
    <>
      <Row className="my-3 d-flex justify-content-between">
        <div>
          <ButtonGroup className="mr-3">
            {RecommendOptions.map((type) => (
              <Button
                key={type}
                active={recommendOption === type}
                onClick={(): void => setRecommendOption(type)}
              >
                {type}
              </Button>
            ))}
          </ButtonGroup>
          <ButtonGroup className="mr-3">
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
          <CustomInput
            type="switch"
            id="switchRecommendExperimental"
            inline
            label={
              <span role="img" aria-label="experimental">
                🧪
              </span>
            }
            checked={recommendExperimental}
            onChange={() => setRecommendExperimental(!recommendExperimental)}
          />
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
      <Row>
        <InputGroup>
          {isLoggedInDevelop ? (
            <InputGroupAddon addonType="prepend">
              <Button
                color="danger"
                outline
                disabled={selectedProblemIdSet.size == 0}
                onClick={() => updateSelectedProblemIdSet.clear()}
              >
                Clear problem selection
              </Button>
            </InputGroupAddon>
          ) : (
            <InputGroupAddon addonType="prepend">
              <InputGroupText>Login to enable problem selection</InputGroupText>
            </InputGroupAddon>
          )}
          <Input disabled={!isLoggedInDevelop} placeholder="New MyList name" />
          <InputGroupAddon addonType="append">
            <Button
              color="success"
              disabled={!isLoggedInDevelop || selectedProblemIdSet.size == 0}
            >
              Create new MyList
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </Row>
      <Row className="my-3">
        <BootstrapTable
          data={recommendedProblems}
          keyField="id"
          height="auto"
          hover
          striped
          selectRow={selectRowProps}
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
            &nbsp;
            <HelpBadgeTooltip id="difficulty">
              Internal rating to have 50% Solve Probability
            </HelpBadgeTooltip>
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="predictedSolveProbability"
            dataFormat={formatPredictedSolveProbability}
          >
            <span>Solve Probability</span>
            &nbsp;
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
            &nbsp;
            <HelpBadgeTooltip id="solvetime">
              Estimated time required to solve this problem.
            </HelpBadgeTooltip>
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    </>
  );
};

export const Recommendations: React.FC<Props> = (props) => {
  const { userSubmissions } = props;

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
  const submittedSet = new Set(userSubmissions.map((s) => s.problem_id));

  return (
    <RecommendationTable
      problems={props.problems}
      problemModels={props.problemModels}
      userRatingInfo={props.userRatingInfo}
      contests={props.contests}
      isLoggedIn={props.isLoggedIn}
      lastSolvedTimeMap={lastSolvedTimeMap}
      submittedSet={submittedSet}
    />
  );
};
