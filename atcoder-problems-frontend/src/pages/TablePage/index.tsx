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
  showAccepted: boolean;
}

const TablePage: React.FC<Props> = props => {
  const {
    userId,
    rivals,
    contestToProblems,
    submissions,
    statusLabelMap,
    showAccepted,
    abc,
    arc,
    agc,
    others,
    othersRated
  } = props;

  const [activeTab, setActiveTab] = useState(TableTab.ABC);

  return (
    <div>
      <Options />
      <TableTabButtons active={activeTab} setActive={setActiveTab} />
      <ContestWrapper display={activeTab === TableTab.ABC}>
        <AtCoderRegularTable
          showSolved={showAccepted}
          contests={abc}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.ARC}>
        <AtCoderRegularTable
          showSolved={showAccepted}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.AGC}>
        <AtCoderRegularTable
          showSolved={showAccepted}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.OtherRatedContests}>
        <ContestTable
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
      <ContestWrapper display={activeTab === TableTab.OtherContests}>
        <ContestTable
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
  showAccepted: state.showAccepted,
  abc: state.abc,
  arc: state.arc,
  agc: state.agc,
  others: state.others,
  othersRated: state.othersRated
});

export default connect(stateToProps)(TablePage);
