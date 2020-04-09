import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { ContestId, ProblemId, ProblemStatus } from "../../interfaces/Status";
import { List, Map, Set } from "immutable";
import { ContestTable } from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";
import Options from "./Options";
import { TableTabButtons } from "./TableTab";
import ProblemModel from "../../interfaces/ProblemModel";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { useLocalStorage } from "../../utils/LocalStorage";
import { ColorMode } from "../../utils/TableColor";
import { classifyContest, ContestCategory } from "./ContestClassifier";

interface OuterProps {
  userId: string;
  rivals: List<string>;
}

interface InnerProps extends OuterProps {
  contestsFetch: PromiseState<Map<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<Map<ContestId, List<Problem>>>;
  problemsFetch: PromiseState<Map<ProblemId, Problem>>;
  problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  statusLabelMapFetch: PromiseState<Map<ProblemId, ProblemStatus>>;
  selectableLanguagesFetch: PromiseState<Set<string>>;
}

const InnerTablePage: React.FC<InnerProps> = props => {
  const {
    contestsFetch,
    contestToProblemsFetch,
    problemModelsFetch,
    statusLabelMapFetch,
    selectableLanguagesFetch
  } = props;

  const [activeTab, setActiveTab] = useLocalStorage<ContestCategory>(
    "activeTab",
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
  const statusLabelMap = statusLabelMapFetch.fulfilled
    ? statusLabelMapFetch.value
    : CachedApiClient.oldStatusLabelMap();
  const selectableLanguages = selectableLanguagesFetch.fulfilled
    ? selectableLanguagesFetch.value
    : Set<string>();

  const filteredContests = contests
    .valueSeq()
    .toArray()
    .filter(c => classifyContest(c) === activeTab);

  return (
    <div>
      <Options
        showAccepted={showAccepted}
        toggleShowAccepted={() => setShowAccepted(!showAccepted)}
        showDifficulties={showDifficulty}
        toggleShowDifficulties={() => setShowDifficulty(!showDifficulty)}
        colorMode={colorMode}
        setColorMode={setColorMode}
        selectableLanguages={selectableLanguages}
        selectedLanguages={selectedLanguages}
        toggleLanguage={language =>
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

export const TablePage = connect<OuterProps, InnerProps>(props => ({
  problemModelsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemModels()
  },
  contestsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedContestMap()
  },
  problemsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemMap()
  },
  contestToProblemsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedContestToProblemMap()
  },
  statusLabelMapFetch: {
    comparison: [props.userId, props.rivals],
    value: () =>
      CachedApiClient.cachedStatusLabelMap(props.userId, props.rivals)
  },
  selectableLanguagesFetch: {
    comparison: props.userId,
    value: () => CachedApiClient.cachedSelectableLanguages(props.userId)
  }
}))(InnerTablePage);
