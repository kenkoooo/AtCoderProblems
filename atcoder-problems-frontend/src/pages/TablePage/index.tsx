import React, { useState } from "react";
import { connect } from "react-redux";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import State, {
  ContestId,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/State";
import { List, Map } from "immutable";
import Submission from "../../interfaces/Submission";
import ContestTable from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";
import Options from "./Options";
import TableTabButtons, { TableTab } from "./TableTab";
import ProblemModel from "../../interfaces/ProblemModel";

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

interface Props {
  userId: string;
  rivals: List<string>;
  submissions: Map<ProblemId, List<Submission>>;
  contests: Map<ContestId, Contest>;
  contestToProblems: Map<ContestId, List<Problem>>;
  problems: Map<ProblemId, Problem>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  abc: Map<ContestId, Contest>;
  arc: Map<ContestId, Contest>;
  agc: Map<ContestId, Contest>;
  othersRated: Map<ContestId, Contest>;
  others: Map<ContestId, Contest>;
  problemModels: Map<ProblemId, ProblemModel>;
}

const TablePage: React.FC<Props> = props => {
  const {
    userId,
    rivals,
    contestToProblems,
    submissions,
    statusLabelMap,
    abc,
    arc,
    agc,
    others,
    othersRated,
    problemModels
  } = props;

  const [activeTab, setActiveTab] = useState(
    new TableTab(true, false, false, false, false));
  const [showAccepted, setShowAccepted] = useState(true);
  const [showDifficulty, setShowDifficulties] = useState(true);

  return (
    <div>
      <Options
        showAccepted={showAccepted}
        toggleShowAccepted={() => setShowAccepted(!showAccepted)}
        showDifficulties={showDifficulty}
        toggleShowDifficulties={() => setShowDifficulties(!showDifficulty)}
      />
      <TableTabButtons active={activeTab} setActive={setActiveTab} />
      <ContestWrapper display={activeTab.ABC}>
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
      <ContestWrapper display={activeTab.ARC}>
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
      <ContestWrapper display={activeTab.AGC}>
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
      <ContestWrapper display={activeTab.OtherRatedContests}>
        <ContestTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          contests={othersRated}
          title="Other Rated Contests"
          contestToProblems={contestToProblems}
          showSolved={showAccepted}
          submissions={submissions}
          userId={userId}
          rivals={rivals}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab.OtherContests}>
        <ContestTable
          problemModels={problemModels}
          showDifficulty={showDifficulty}
          contests={others}
          title="Other Contests"
          contestToProblems={contestToProblems}
          showSolved={showAccepted}
          submissions={submissions}
          userId={userId}
          rivals={rivals}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
    </div>
  );
};

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  contestToProblems: state.contestToProblems,
  problems: state.problems,
  contests: state.contests,
  submissions: state.submissions,
  statusLabelMap: state.cache.statusLabelMap,
  problemModels: state.problemModels,
  abc: state.abc,
  arc: state.arc,
  agc: state.agc,
  others: state.others,
  othersRated: state.othersRated
});

export default connect(stateToProps)(TablePage);
