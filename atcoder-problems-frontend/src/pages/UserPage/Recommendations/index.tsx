import React, { useState } from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { useHistory } from "react-router-dom";
import { Button, ButtonGroup, Row } from "reactstrap";
import {
  useContestMap,
  useMergedProblemMap,
  useProblemModelMap,
  useRatingInfo,
  useUserSubmission,
} from "../../../api/APIClient";
import { useLoginState } from "../../../api/InternalAPIClient";
import { ContestLink } from "../../../components/ContestLink";
import { HelpBadgeTooltip } from "../../../components/HelpBadgeTooltip";
import { NewTabLink } from "../../../components/NewTabLink";
import { ProblemLink } from "../../../components/ProblemLink";
import Problem from "../../../interfaces/Problem";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import {
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
} from "../../../utils/ProblemModelUtil";
import * as Url from "../../../utils/Url";
import * as UserState from "../../../utils/UserState";
import { useLocalStorage } from "../../../utils/LocalStorage";
import {
  createContestLocationFromProblemIds,
  selectRowPropsForProblemSelection,
  useProblemIdSelection,
} from "../../../utils/ProblemSelection";
import {
  ExcludeOption,
  getCurrentSecond,
  getLastSolvedTimeMap,
  getMaximumExcludeElapsedSecond,
} from "../../../utils/LastSolvedTime";
import { classifyContest } from "../../../utils/ContestClassifier";
import { getLikeContestCategory } from "../../../utils/LikeContestUtils";
import { recommendProblems } from "./RecommendProblems";
import {
  CategoryOption,
  RecommendController,
  RecommendOption,
} from "./RecommendController";

interface Props {
  userId: string;
}

export const Recommendations = (props: Props) => {
  const history = useHistory();

  const [recommendOption, setRecommendOption] = useLocalStorage<
    RecommendOption
  >("recommendOption", "Moderate");
  const [recommendExperimental, setRecommendExperimental] = useLocalStorage<
    boolean
  >("recommendExperimental", true);
  const [excludeOption, setExcludeOption] = useLocalStorage<ExcludeOption>(
    "recoomendExcludeOption",
    "Exclude"
  );

  const [mergeLikeContest, setMergeLikeContest] = useLocalStorage<boolean>(
    "recommendMergeLikeContest",
    true
  );

  const [categoryOption, setCategoryOption] = useLocalStorage<CategoryOption>(
    "recommendCategoryOption",
    "All"
  );
  const [recommendNum, setRecommendNum] = useState(10);

  const [
    getSelectedProblemIds,
    selectProblemIds,
    deselectProblemIds,
  ] = useProblemIdSelection();

  const userSubmissions = useUserSubmission(props.userId) ?? [];
  const { data: mergedProblemsMap } = useMergedProblemMap();
  const problems = mergedProblemsMap
    ? Array.from(mergedProblemsMap.values())
    : [];
  const contestMap = useContestMap();
  const problemModels = useProblemModelMap();
  const loginState = useLoginState().data;
  const isLoggedIn = UserState.isLoggedIn(loginState);

  const userRatingInfo = useRatingInfo(props.userId);

  if (userSubmissions.length === 0) {
    return null;
  }

  const selectedProblemIds = getSelectedProblemIds();
  const isNoProblemSelected = selectedProblemIds.length === 0;
  const createContest = () => {
    history.push(createContestLocationFromProblemIds(selectedProblemIds));
  };
  const selectRowProps = selectRowPropsForProblemSelection(
    selectedProblemIds,
    getSelectedProblemIds,
    selectProblemIds,
    deselectProblemIds
  );

  const lastSolvedTimeMap = getLastSolvedTimeMap(userSubmissions);
  const submittedSet = new Set(userSubmissions.map((s) => s.problem_id));

  const filteredRecommendedProblems = recommendProblems(
    problems,
    (problemId: ProblemId) => {
      if (excludeOption === "Exclude submitted") {
        return !submittedSet.has(problemId);
      }
      const lastSolvedTime = lastSolvedTimeMap.get(problemId);
      const elapsedSecond = lastSolvedTime
        ? getCurrentSecond() - lastSolvedTime
        : Number.MAX_SAFE_INTEGER;
      return getMaximumExcludeElapsedSecond(excludeOption) < elapsedSecond;
    },
    (contestId: ContestId) => {
      if (categoryOption === "All") return true;
      const contest = contestMap?.get(contestId);
      if (!contest) {
        return false;
      }
      return (
        classifyContest(contest) === categoryOption ||
        (mergeLikeContest &&
          classifyContest(contest) === getLikeContestCategory(categoryOption))
      );
    },
    (problemId: ProblemId) => problemModels?.get(problemId),
    recommendExperimental,
    userRatingInfo.internalRating,
    recommendOption,
    recommendNum
  );

  return (
    <>
      <Row className="my-3 d-flex justify-content-between">
        <RecommendController
          recommendOption={recommendOption}
          onChangeRecommendOption={(option) => setRecommendOption(option)}
          excludeOption={excludeOption}
          onChangeExcludeOption={(option) => setExcludeOption(option)}
          categoryOption={categoryOption}
          onChangeCategoryOption={(option) => setCategoryOption(option)}
          showExperimental={recommendExperimental}
          onChangeExperimentalVisibility={(show) =>
            setRecommendExperimental(show)
          }
          mergeLikeContest={mergeLikeContest}
          onChangeMergeLikeContest={(merge) => setMergeLikeContest(merge)}
          showCount={recommendNum}
          onChangeShowCount={(value) => setRecommendNum(value)}
        />
      </Row>
      {isLoggedIn && (
        <Row>
          <ButtonGroup>
            <Button
              color="success"
              disabled={isNoProblemSelected}
              onClick={createContest}
            >
              Create Virtual Contest
            </Button>
          </ButtonGroup>
        </Row>
      )}
      <Row className="my-3">
        <BootstrapTable
          data={filteredRecommendedProblems}
          keyField="id"
          height="auto"
          hover
          striped
          selectRow={isLoggedIn ? selectRowProps : undefined}
        >
          <TableHeaderColumn
            dataField="title"
            dataFormat={(
              name: string,
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
                problemName={name}
                contestId={contest_id}
                problemModel={problemModels?.get(id) ?? null}
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
              const contest = contestMap?.get(contestId);
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
