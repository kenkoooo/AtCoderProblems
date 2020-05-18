import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import { List, Map, Set } from "immutable";
import {
  constructStatusLabelMap,
  ContestId,
  ProblemId,
} from "../../interfaces/Status";
import Problem from "../../interfaces/Problem";
import Contest from "../../interfaces/Contest";
import ProblemModel from "../../interfaces/ProblemModel";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { useLocalStorage } from "../../utils/LocalStorage";
import { ColorMode } from "../../utils/TableColor";
import Submission from "../../interfaces/Submission";
import { fetchUserSubmissions } from "../../utils/Api";
import {
  filterResetProgress,
  ProgressResetList,
  UserResponse,
} from "../Internal/types";
import { PROGRESS_RESET_LIST, USER_GET } from "../Internal/ApiUrl";
import { classifyContest, ContestCategory } from "./ContestClassifier";
import { TableTabButtons } from "./TableTab";
import Options from "./Options";
import { ContestTable } from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";

interface OuterProps {
  userId: string;
  rivals: List<string>;
}

interface InnerProps extends OuterProps {
  readonly contestsFetch: PromiseState<Map<ContestId, Contest>>;
  readonly contestToProblemsFetch: PromiseState<Map<ContestId, List<Problem>>>;
  readonly problemsFetch: PromiseState<Map<ProblemId, Problem>>;
  readonly problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  readonly selectableLanguagesFetch: PromiseState<Set<string>>;
  readonly submissions: PromiseState<Submission[]>;
  readonly loginState: PromiseState<UserResponse | null>;
  readonly progressResetList: PromiseState<ProgressResetList | null>;
}

const InnerTablePage: React.FC<InnerProps> = (props) => {
  const {
    contestsFetch,
    contestToProblemsFetch,
    problemModelsFetch,
    selectableLanguagesFetch,
  } = props;

  const [activeTab, setActiveTab] = useLocalStorage<ContestCategory>(
    "contestTableTab",
    "ABC"
  );
  const [showAccepted, setShowAccepted] = useLocalStorage("showAccepted", true);
  const [showDifficulty, setShowDifficulty] = useLocalStorage(
    "showDifficulty",
    true
  );
  const [colorMode, setColorMode] = useLocalStorage(
    "colorMode",
    ColorMode.None
  );
  const [selectedLanguages, setSelectedLanguages] = useState(Set<string>());

  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : CachedApiClient.oldProblemModels();
  const contestToProblems = contestToProblemsFetch.fulfilled
    ? contestToProblemsFetch.value
    : Map<ContestId, List<Problem>>();
  const contests = contestsFetch.fulfilled
    ? contestsFetch.value
    : Map<ContestId, Contest>();
  const selectableLanguages = selectableLanguagesFetch.fulfilled
    ? selectableLanguagesFetch.value
    : Set<string>();
  const submissions = props.submissions.fulfilled
    ? props.submissions.value
    : [];

  const loginUserId =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.atcoder_user_id
      ? props.loginState.value.atcoder_user_id
      : undefined;
  const progressReset =
    props.progressResetList.fulfilled && props.progressResetList.value
      ? props.progressResetList.value
      : undefined;

  const filteredSubmissions =
    loginUserId && progressReset
      ? filterResetProgress(submissions, progressReset, loginUserId)
      : submissions;

  const statusLabelMap = constructStatusLabelMap(
    filteredSubmissions,
    props.userId
  );
  const filteredContests = contests
    .valueSeq()
    .toArray()
    .filter((c) => classifyContest(c) === activeTab);

  return (
    <div>
      <Options
        showAccepted={showAccepted}
        toggleShowAccepted={(): void => setShowAccepted(!showAccepted)}
        showDifficulties={showDifficulty}
        toggleShowDifficulties={(): void => setShowDifficulty(!showDifficulty)}
        colorMode={colorMode}
        setColorMode={setColorMode}
        selectableLanguages={selectableLanguages}
        selectedLanguages={selectedLanguages}
        toggleLanguage={(language): void =>
          setSelectedLanguages(
            selectedLanguages.has(language)
              ? selectedLanguages.delete(language)
              : selectedLanguages.add(language)
          )
        }
      />
      <TableTabButtons active={activeTab} setActive={setActiveTab} />
      {["ABC", "ARC", "AGC"].includes(activeTab) ? (
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          colorMode={colorMode}
          contests={filteredContests}
          title={
            activeTab === "ABC"
              ? "AtCoder Beginner Contest"
              : activeTab === "ARC"
              ? "AtCoder Regular Contest"
              : "AtCoder Grand Contest"
          }
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      ) : (
        <ContestTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          contests={filteredContests}
          title={activeTab}
          contestToProblems={contestToProblems}
          showSolved={showAccepted}
          colorMode={colorMode}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      )}
    </div>
  );
};

export const TablePage = connect<OuterProps, InnerProps>((props) => ({
  problemModelsFetch: {
    comparison: null,
    value: (): Promise<Map<string, ProblemModel>> =>
      CachedApiClient.cachedProblemModels(),
  },
  contestsFetch: {
    comparison: null,
    value: (): Promise<Map<string, Contest>> =>
      CachedApiClient.cachedContestMap(),
  },
  problemsFetch: {
    comparison: null,
    value: (): Promise<Map<string, Problem>> =>
      CachedApiClient.cachedProblemMap(),
  },
  contestToProblemsFetch: {
    comparison: null,
    value: (): Promise<Map<string, List<Problem>>> =>
      CachedApiClient.cachedContestToProblemMap(),
  },
  selectableLanguagesFetch: {
    comparison: props.userId,
    value: (): Promise<Set<string>> =>
      CachedApiClient.cachedSelectableLanguages(props.userId),
  },
  submissions: {
    comparison: [props.userId, props.rivals],
    value: (): Promise<Submission[]> =>
      Promise.all(
        props.rivals.push(props.userId).map((id) => fetchUserSubmissions(id))
      ).then((arrays: Submission[][]) => arrays.flatMap((array) => array)),
  },
  loginState: USER_GET,
  progressResetList: PROGRESS_RESET_LIST,
}))(InnerTablePage);
