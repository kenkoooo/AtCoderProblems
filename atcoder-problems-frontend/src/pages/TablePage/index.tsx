import React, { useMemo, useState } from "react";
import { List } from "immutable";
import {
  useContests,
  useContestToMergedProblems,
  useRatingInfo,
  useUserSubmission,
  useMultipleUserSubmissions,
} from "../../api/APIClient";
import {
  useLoginState,
  useProgressResetList,
} from "../../api/InternalAPIClient";
import MergedProblem from "../../interfaces/MergedProblem";
import { constructStatusLabelMap, ContestId } from "../../interfaces/Status";
import { useLocalStorage } from "../../utils/LocalStorage";
import { ColorMode } from "../../utils/TableColor";
import { filterResetProgress } from "../Internal/types";
import { loggedInUserId } from "../../utils/UserState";
import {
  classifyContest,
  ContestCategory,
} from "../../utils/ContestClassifier";
import { getLikeContestCategory } from "../../utils/LikeContestUtils";
import { TableTabButtons } from "./TableTab";
import { Options } from "./Options";
import { ContestTable } from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";

interface OuterProps {
  userId: string;
  rivals: List<string>;
}

export const TablePage: React.FC<OuterProps> = (props) => {
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
  const [mergeLikeContest, setMergeLikeContest] = useLocalStorage(
    "MergeLikeContest",
    false
  );
  const [selectedLanguages, setSelectedLanguages] = useState(new Set<string>());
  const userRatingInfo = useRatingInfo(props.userId);
  const contestToProblems =
    useContestToMergedProblems() ?? new Map<ContestId, MergedProblem[]>();
  const { data: contests } = useContests();
  const selectableLanguages = new Set(
    useUserSubmission(props.userId)?.map((s) => s.language) ?? []
  );
  const submissions =
    useMultipleUserSubmissions(props.rivals.push(props.userId).toArray())
      .data ?? [];
  const loginState = useLoginState().data;
  const loginUserId = loggedInUserId(loginState);
  const progressReset = useProgressResetList().data;

  const filteredSubmissions =
    loginUserId && progressReset
      ? filterResetProgress(submissions, progressReset, loginUserId)
      : submissions;

  const statusLabelMap = constructStatusLabelMap(
    filteredSubmissions,
    props.userId
  );

  const filteredContests = useMemo(() => {
    if (!contests) {
      return [];
    }
    return contests.filter((contest) => {
      const contestType = classifyContest(contest);
      if (contestType === activeTab) {
        return true;
      }
      return (
        mergeLikeContest && getLikeContestCategory(activeTab) === contestType
      );
    });
  }, [contests, activeTab, mergeLikeContest]);

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
        toggleLanguage={(language): void => {
          const newSet = new Set(selectedLanguages);
          newSet.has(language) ? newSet.delete(language) : newSet.add(language);
          setSelectedLanguages(newSet);
        }}
        mergeLikeContest={mergeLikeContest}
        setMergeLikeContest={setMergeLikeContest}
      />
      <TableTabButtons
        active={activeTab}
        setActive={setActiveTab}
        mergeLikeContest={mergeLikeContest}
      />
      {[
        "ABC",
        "ARC",
        "AGC",
        "ABC-Like",
        "ARC-Like",
        "AGC-Like",
        "PAST",
      ].includes(activeTab) ? (
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
              : activeTab === "PAST"
              ? "PAST"
              : `${activeTab} Contest`
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
