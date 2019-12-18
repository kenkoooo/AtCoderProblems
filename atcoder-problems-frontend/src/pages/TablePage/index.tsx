import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import {
  ContestId,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/Status";
import { List, Map, Set } from "immutable";
import Submission from "../../interfaces/Submission";
import ContestTable from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";
import Options from "./Options";
import TableTabButtons, { TableTab } from "./TableTab";
import ProblemModel from "../../interfaces/ProblemModel";
import * as CachedApiClient from "../../utils/CachedApiClient";

const ContestWrapper: React.FC<{ display: boolean; children: any }> = props => {
  return (
    <div style={{ display: props.display ? "" : "none" }}>{props.children}</div>
  );
};

export const statusLabelToTableColor = (label: StatusLabel) => {
  switch (label) {
    case StatusLabel.Success:
      return "table-success";
    case StatusLabel.Failed:
      return "table-danger";
    case StatusLabel.Warning:
      return "table-warning";
    case StatusLabel.None:
      return "";
    default:
      return "";
  }
};

interface OuterProps {
  userId: string;
  rivals: List<string>;
}

interface InnerProps extends OuterProps {
  submissionsFetch: PromiseState<Map<ProblemId, List<Submission>>>;
  contestsFetch: PromiseState<Map<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<Map<ContestId, List<Problem>>>;
  problemsFetch: PromiseState<Map<ProblemId, Problem>>;
  problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  statusLabelMapFetch: PromiseState<Map<ProblemId, ProblemStatus>>;
}

const TablePage: React.FC<InnerProps> = props => {
  const {
    contestsFetch,
    contestToProblemsFetch,
    submissionsFetch,
    problemModelsFetch,
    statusLabelMapFetch
  } = props;

  const [activeTab, setActiveTab] = useState(TableTab.ABC);
  const [showAccepted, setShowAccepted] = useState(true);
  const [showDifficulty, setShowDifficulties] = useState(true);

  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : Map<ProblemId, ProblemModel>();
  const contestToProblems = contestToProblemsFetch.fulfilled
    ? contestToProblemsFetch.value
    : Map<ContestId, List<Problem>>();
  const submissions = submissionsFetch.fulfilled
    ? submissionsFetch.value
    : Map<ProblemId, List<Submission>>();
  const contests = contestsFetch.fulfilled
    ? contestsFetch.value
    : Map<ContestId, Contest>();
  const statusLabelMap = statusLabelMapFetch.fulfilled
    ? statusLabelMapFetch.value
    : Map<ProblemId, ProblemStatus>();
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
        toggleShowDifficulties={() => setShowDifficulties(!showDifficulty)}
      />
      <TableTabButtons active={activeTab} setActive={setActiveTab} />
      <ContestWrapper display={activeTab === TableTab.ABC}>
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          contests={abc}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.ARC}>
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.AGC}>
        <AtCoderRegularTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          showSolved={showAccepted}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
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
          statusLabelMap={statusLabelMap}
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
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
    </div>
  );
};

export default connect<OuterProps, InnerProps>(props => ({
  submissionsFetch: {
    comparison: [props.userId, props.rivals],
    value: () =>
      CachedApiClient.cachedUsersSubmissions(props.rivals.push(props.userId))
  },
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
  }
}))(TablePage);
