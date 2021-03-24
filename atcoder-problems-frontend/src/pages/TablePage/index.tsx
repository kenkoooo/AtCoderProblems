import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import { List, Set as ImmutableSet } from "immutable";
import {
  useContests,
  useContestToProblems,
  useRatingInfo,
  useUserSubmission,
} from "../../api/APIClient";
import { useLoginState } from "../../api/InternalAPIClient";
import Problem from "../../interfaces/Problem";
import { constructStatusLabelMap, ContestId } from "../../interfaces/Status";
import { useLocalStorage } from "../../utils/LocalStorage";
import { ColorMode } from "../../utils/TableColor";
import Submission from "../../interfaces/Submission";
import { fetchUserSubmissions } from "../../utils/Api";
import { filterResetProgress, ProgressResetList } from "../Internal/types";
import { PROGRESS_RESET_LIST } from "../Internal/ApiUrl";
import { loggedInUserId } from "../../utils/UserState";
import { classifyContest, ContestCategory } from "./ContestClassifier";
import { TableTabButtons } from "./TableTab";
import { Options } from "./Options";
import { ContestTable } from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";

interface OuterProps {
  userId: string;
  rivals: List<string>;
}

interface InnerProps extends OuterProps {
  readonly submissions: PromiseState<Submission[]>;
  readonly progressResetList: PromiseState<ProgressResetList | null>;
}

const InnerTablePage: React.FC<InnerProps> = (props) => {
  const [activeTab, setActiveTab] = useLocalStorage<ContestCategory>(
    "contestTableTab",
    "ABC"
  );
  const [hideCompletedContest, setHideCompletedContest] = useLocalStorage(
    "hideCompletedContest",
    false
  );
  const [showDifficulty, setShowDifficulty] = useLocalStorage(
    "showDifficulty",
    true
  );
  const [colorMode, setColorMode] = useLocalStorage(
    "colorMode",
    ColorMode.None
  );
  const [showPenalties, setShowPenalties] = useLocalStorage(
    "showPenalties",
    false
  );
  const [selectedLanguages, setSelectedLanguages] = useState(
    ImmutableSet<string>()
  );
  const userRatingInfo = useRatingInfo(props.userId);
  const contestToProblems =
    useContestToProblems() ?? new Map<ContestId, Problem[]>();
  const { data: contests } = useContests();
  const selectableLanguages = new Set(
    useUserSubmission(props.userId)?.map((s) => s.language) ?? []
  );
  const submissions = props.submissions.fulfilled
    ? props.submissions.value
    : [];
  const loginState = useLoginState().data;
  const loginUserId = loggedInUserId(loginState);
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
  const filteredContests =
    contests?.filter((c) => classifyContest(c) === activeTab) ?? [];

  return (
    <div>
      <Options
        hideCompletedContest={hideCompletedContest}
        toggleHideCompletedContest={(): void =>
          setHideCompletedContest(!hideCompletedContest)
        }
        showDifficulties={showDifficulty}
        toggleShowDifficulties={(): void => setShowDifficulty(!showDifficulty)}
        colorMode={colorMode}
        setColorMode={setColorMode}
        showPenalties={showPenalties}
        toggleShowPenalties={(): void => setShowPenalties(!showPenalties)}
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
      {["ABC", "ARC", "AGC", "ABC-Like", "ARC-Like"].includes(activeTab) ? (
        <AtCoderRegularTable
          showDifficulty={showDifficulty}
          hideCompletedContest={hideCompletedContest}
          colorMode={colorMode}
          contests={filteredContests}
          title={
            activeTab === "ABC"
              ? "AtCoder Beginner Contest"
              : activeTab === "ARC"
              ? "AtCoder Regular Contest"
              : activeTab === "AGC"
              ? "AtCoder Grand Contest"
              : activeTab === "ABC-Like"
              ? "ABC-Like Contest"
              : "ARC-Like Contest"
          }
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          showPenalties={showPenalties}
          selectedLanguages={selectedLanguages}
          userRatingInfo={userRatingInfo}
        />
      ) : (
        <ContestTable
          showDifficulty={showDifficulty}
          contests={filteredContests}
          title={activeTab}
          contestToProblems={contestToProblems}
          hideCompletedContest={hideCompletedContest}
          colorMode={colorMode}
          statusLabelMap={statusLabelMap}
          showPenalties={showPenalties}
          selectedLanguages={selectedLanguages}
          userRatingInfo={userRatingInfo}
        />
      )}
    </div>
  );
};

export const TablePage = connect<OuterProps, InnerProps>((props) => ({
  submissions: {
    comparison: [props.userId, props.rivals],
    value: (): Promise<Submission[]> =>
      Promise.all(
        props.rivals.push(props.userId).map((id) => fetchUserSubmissions(id))
      ).then((arrays: Submission[][]) => arrays.flatMap((array) => array)),
  },
  progressResetList: PROGRESS_RESET_LIST,
}))(InnerTablePage);
