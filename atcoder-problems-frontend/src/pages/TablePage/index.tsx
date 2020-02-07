import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { ContestId, ProblemId, ProblemStatus } from "../../interfaces/Status";
import { List, Map, Set } from "immutable";
import ContestTable from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";
import Options from "./Options";
import TableTabButtons, { TableTab } from "./TableTab";
import ProblemModel from "../../interfaces/ProblemModel";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { useParams } from "react-router-dom";
import { useLocalStorage } from "../../utils/LocalStorage";

const ContestWrapper: React.FC<{ display: boolean; children: any }> = props => {
  return (
    <div style={{ display: props.display ? "" : "none" }}>{props.children}</div>
  );
};

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

const TablePage: React.FC<InnerProps> = props => {
  const {
    contestsFetch,
    contestToProblemsFetch,
    problemModelsFetch,
    statusLabelMapFetch,
    selectableLanguagesFetch
  } = props;

  const [activeTab, setActiveTab] = useState(TableTab.ABC);
  const [showAccepted, setShowAccepted] = useLocalStorage("showAccepted", true);
  const [showDifficulty, setShowDifficulty] = useLocalStorage(
    "showDifficulty",
    true
  );
  const [enableColorfulMode, setEnableColorfulMode] = useLocalStorage(
    "enableColorfulMode",
    true
  );
  const [selectedLanguages, setSelectedLanguages] = useState(Set<string>());

  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : Map<ProblemId, ProblemModel>();
  const contestToProblems = contestToProblemsFetch.fulfilled
    ? contestToProblemsFetch.value
    : Map<ContestId, List<Problem>>();
  const contests = contestsFetch.fulfilled
    ? contestsFetch.value
    : Map<ContestId, Contest>();
  const statusLabelMap = statusLabelMapFetch.fulfilled
    ? statusLabelMapFetch.value
    : Map<ProblemId, ProblemStatus>();
  const selectableLanguages = selectableLanguagesFetch.fulfilled
    ? selectableLanguagesFetch.value
    : Set<string>();
  const abc = contests.filter((v, k) => k.match(/^abc\d{3}$/));
  const arc = contests.filter((v, k) => k.match(/^arc\d{3}$/));
  const agc = contests.filter((v, k) => k.match(/^agc\d{3}$/));
  const atcoderContestIds = [abc, arc, agc]
    .map(s => s.keySeq())
    .reduce((set, keys) => set.concat(keys), Set<ContestId>());
  const othersRated = contests
    .filter(contest => !atcoderContestIds.has(contest.id))
    .filter(contest => contest.rate_change !== "-")
    .filter(contest => contest.start_epoch_second >= 1468670400); // agc001
  const ratedContestIds = atcoderContestIds.concat(othersRated.keySeq());
  const others = contests.filter(c => !ratedContestIds.has(c.id));

  return (
    <div>
      <Options
        showAccepted={showAccepted}
        toggleShowAccepted={() => setShowAccepted(!showAccepted)}
        showDifficulties={showDifficulty}
        toggleShowDifficulties={() => setShowDifficulty(!showDifficulty)}
        enableColorfulMode={enableColorfulMode}
        toggleEnableColorfulMode={() =>
          setEnableColorfulMode(!enableColorfulMode)
        }
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
      <ContestWrapper display={activeTab === TableTab.ABC}>
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          enableColorfulMode={enableColorfulMode}
          contests={abc.valueSeq()}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.ARC}>
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          enableColorfulMode={enableColorfulMode}
          contests={arc.valueSeq()}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.AGC}>
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          enableColorfulMode={enableColorfulMode}
          contests={agc.valueSeq()}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.OtherRatedContests}>
        <ContestTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          contests={othersRated.valueSeq()}
          title="Other Rated Contests"
          contestToProblems={contestToProblems}
          showSolved={showAccepted}
          enableColorfulMode={enableColorfulMode}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.OtherContests}>
        <ContestTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          contests={others.valueSeq()}
          title="Other Contests"
          contestToProblems={contestToProblems}
          showSolved={showAccepted}
          enableColorfulMode={enableColorfulMode}
          statusLabelMap={statusLabelMap}
          selectedLanguages={selectedLanguages}
        />
      </ContestWrapper>
    </div>
  );
};

const InnerTablePage = connect<OuterProps, InnerProps>(props => ({
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
}))(TablePage);

export default () => {
  const { userIds } = useParams();
  const userId = (userIds ?? "").split("/")[0];
  const rivals = (userIds ?? "/").split("/");
  const rivalList = List(rivals)
    .skip(1)
    .filter(x => x.length > 0);
  return <InnerTablePage userId={userId} rivals={rivalList} />;
};
