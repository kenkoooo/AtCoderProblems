import React from "react";
import { FormGroup, Input, Label, Row, ButtonGroup, Button } from "reactstrap";
import {Dispatch} from "redux";
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
import ProblemModel from "../../interfaces/ProblemModel";
import ContestTable from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";
import Options from "./Options";
import TableTabButtons, {TableTab} from "./TableTab";
import HelpBadgeTooltip from "../../components/HelpBadgeTooltip";
import {TableHeaderColumn} from "react-bootstrap-table";

const ContestWrapper: React.FC<{display: boolean, children: any}> = props => {
  return (
    <div style={{display: props.display? "" : "none"}}>
      {props.children}
    </div>
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
  contestToProblemsId: Map<ContestId, List<ProblemId>>;
  problems: Map<ProblemId, Problem>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  activeTab: TableTab;
  showAccepted: boolean;
}

let abc: Map<ContestId, Contest> = Map<ContestId, Contest>();
let arc: Map<ContestId, Contest> = Map<ContestId, Contest>();
let agc: Map<ContestId, Contest> = Map<ContestId, Contest>();
let othersRated: Map<ContestId, Contest> = Map<ContestId, Contest>();
let others: Map<ContestId, Contest> = Map<ContestId, Contest>();
let contestToProblems: Map<ContestId, List<Problem>> = Map<ContestId, List<Problem>>();
let rendered: Set<TableTab> = new Set<TableTab>();
let contestInitialized: boolean = false;

const TablePage: React.FC<Props> = props => {
  const {
    userId,
    rivals,
    contests,
    contestToProblemsId,
    problems,
    submissions,
    statusLabelMap,
    activeTab,
    showAccepted,
  } = props;

  rendered.add(activeTab);

  if(contestInitialized === false && contests && contests.size !== 0){
    contestInitialized = true;
    contestToProblems = contestToProblemsId.map(list =>
      list
        .map(id => problems.get(id))
        .filter(
          (problem: Problem | undefined): problem is Problem =>
            problem !== undefined
        )
    );
    abc = contests.filter((v, k) => k.match(/^abc\d{3}$/));
    arc = contests.filter((v, k) => k.match(/^arc\d{3}$/));
    agc = contests.filter((v, k) => k.match(/^agc\d{3}$/));
    let ratedContests = new Set<string>();
    abc.forEach((v, k) => ratedContests.add(k));
    arc.forEach((v, k) => ratedContests.add(k));
    agc.forEach((v, k) => ratedContests.add(k));
    othersRated = contests
      .filter((v,k) => !ratedContests.has(k) )
      .filter((v,k) => v.rate_change !== "-" )
      .filter((v,k) => v.start_epoch_second >= 1468670400); // agc001
    othersRated.forEach((v, k) => ratedContests.add(k));
    others = contests.filter((v,k) => !ratedContests.has(k) );
  }

  return (
    <div>
      <Options />
      <TableTabButtons />
      <ContestWrapper display={activeTab === TableTab.ABC}>
        <AtCoderRegularTable
          showSolved={showAccepted}
          contests={abc}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          rendered={rendered.has(TableTab.ABC)}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.ARC}>
        <AtCoderRegularTable
          showSolved={showAccepted}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          rendered={rendered.has(TableTab.ARC)}
        />
      </ContestWrapper>
      <ContestWrapper display={activeTab === TableTab.AGC}>
        <AtCoderRegularTable
          showSolved={showAccepted}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          rendered={rendered.has(TableTab.AGC)}
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
          rendered={rendered.has(TableTab.OtherRatedContests)}
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
          rendered={rendered.has(TableTab.OtherContests)}
        />
      </ContestWrapper>
    </div>
  );
}

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  contestToProblemsId: state.contestToProblems,
  problems: state.problems,
  contests: state.contests,
  submissions: state.submissions,
  statusLabelMap: state.cache.statusLabelMap,
  showAccepted: state.showAccepted,
  activeTab: state.activeTableTab,
});

export default connect(
  stateToProps
)(TablePage);
