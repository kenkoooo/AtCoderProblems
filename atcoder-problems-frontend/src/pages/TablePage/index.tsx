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
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  activeTab: TableTab;
  showAccepted: boolean;
}

const TablePage: React.FC<Props> = props => {
  const {
    userId,
    rivals,
    contests,
    contestToProblems,
    submissions,
    statusLabelMap,
    activeTab,
    showAccepted,
  } = props;

  const abc = contests.filter((v, k) => k.match(/^abc\d{3}$/));
  const arc = contests.filter((v, k) => k.match(/^arc\d{3}$/));
  const agc = contests.filter((v, k) => k.match(/^agc\d{3}$/));
  let ratedContests = new Set();
  abc.forEach((v, k) => ratedContests.add(k));
  arc.forEach((v, k) => ratedContests.add(k));
  agc.forEach((v, k) => ratedContests.add(k));
  const othersRated = contests
    .filter((v,k) => !ratedContests.has(k) )
    .filter((v,k) => v.rate_change !== "-" )
    .filter((v,k) => v.start_epoch_second >= 1468670400); // agc001
  othersRated.forEach((v, k) => ratedContests.add(k));
  const others = contests.filter((v,k) => !ratedContests.has(k) );

  return (
    <div>
      <Options />
      <TableTabButtons />
      {
        activeTab === TableTab.ABC ?
          (
            <AtCoderRegularTable
              showSolved={showAccepted}
              contests={abc}
              title="AtCoder Beginner Contest"
              contestToProblems={contestToProblems}
              statusLabelMap={statusLabelMap}
            />
          ) :
        activeTab === TableTab.ARC ?
          (
            <AtCoderRegularTable
              showSolved={showAccepted}
              contests={arc}
              title="AtCoder Regular Contest"
              contestToProblems={contestToProblems}
              statusLabelMap={statusLabelMap}
            />
          ) :
        activeTab === TableTab.AGC ?
          (
            <AtCoderRegularTable
              showSolved={showAccepted}
              contests={agc}
              title="AtCoder Grand Contest"
              contestToProblems={contestToProblems}
              statusLabelMap={statusLabelMap}
            />
          ) :
        activeTab === TableTab.OtherRatedContests ?
          (
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
          ) :
        activeTab === TableTab.OtherContests ?
          (
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
          ) :
        (null)
      }
    </div>
  );
}

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  contestToProblems: state.contestToProblems.map(list =>
    list
      .map(id => state.problems.get(id))
      .filter(
        (problem: Problem | undefined): problem is Problem =>
          problem !== undefined
      )
  ),
  contests: state.contests,
  submissions: state.submissions,
  statusLabelMap: state.cache.statusLabelMap,
  showAccepted: state.showAccepted,
  activeTab: state.activeTableTab,
});

export default connect(
  stateToProps
)(TablePage);
