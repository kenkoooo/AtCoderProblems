import React, { useState } from "react";
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
import { NewTabLink } from "../../../components/NewTabLink";
import { ProblemLink } from "../../../components/ProblemLink";
import Problem from "../../../interfaces/Problem";
import { ProblemId } from "../../../interfaces/Status";
import * as Url from "../../../utils/Url";
import * as UserState from "../../../utils/UserState";
import { useLocalStorage } from "../../../utils/LocalStorage";
import {
  createContestLocationFromProblemIds,
  useProblemIdSelection,
} from "../../../utils/ProblemSelection";
import {
  ExcludeOption,
  getCurrentSecond,
  getLastSolvedTimeMap,
  getMaximumExcludeElapsedSecond,
} from "../../../utils/LastSolvedTime";
import { recommendProblems } from "./RecommendProblems";
import { RecommendController, RecommendOption } from "./RecommendController";
import { RecommendTable } from "./RecommendTable";

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

  const problemModels = useProblemModelMap();
  const userRatingInfo = useRatingInfo(props.userId);
  const contestMap = useContestMap();

  const loginState = useLoginState().data;
  const isLoggedIn = UserState.isLoggedIn(loginState);

  if (userSubmissions.length === 0) {
    return null;
  }

  const selectedProblemIds = getSelectedProblemIds();
  const isNoProblemSelected = selectedProblemIds.length === 0;
  const createContest = () => {
    history.push(createContestLocationFromProblemIds(selectedProblemIds));
  };

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
    (problemId: ProblemId) => problemModels?.get(problemId),
    recommendExperimental,
    userRatingInfo.internalRating,
    recommendOption,
    recommendNum
  );

  const formatProblemName = (
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
      problemName={title}
      contestId={contest_id}
      problemModel={problemModels?.get(id) ?? null}
      userRatingInfo={userRatingInfo}
    />
  );
  const formatContestName = (
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
  };

  return (
    <>
      <Row className="my-3 d-flex justify-content-between">
        <RecommendController
          recommendOption={recommendOption}
          onChangeRecommendOption={(option) => setRecommendOption(option)}
          excludeOption={excludeOption}
          onChangeExcludeOption={(option) => setExcludeOption(option)}
          showExperimental={recommendExperimental}
          onChangeExperimentalVisibility={(show) =>
            setRecommendExperimental(show)
          }
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
        <RecommendTable
          filteredRecommendedProblems={filteredRecommendedProblems}
          getSelectedProblemIds={getSelectedProblemIds}
          selectProblemIds={selectProblemIds}
          deselectProblemIds={deselectProblemIds}
          formatProblemName={formatProblemName}
          formatContestName={formatContestName}
        />
      </Row>
    </>
  );
};
