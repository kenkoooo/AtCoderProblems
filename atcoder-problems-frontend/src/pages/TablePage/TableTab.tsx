import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";
import {Dispatch} from "redux";
import { connect } from "react-redux";
import State from "../../interfaces/State";
import {updateActiveTableTab} from "../../actions";

export enum TableTab {
  ABC,
  ARC,
  AGC,
  OtherRatedContests,
  OtherContests
}

interface TableTabProps {
  active: TableTab,
  onClick: (nextActive: TableTab)=>void,
}

const TableTabButtons: React.FC<TableTabProps> = props => {
  const {active, onClick} = props;
  return (
    <Row>
      <ButtonGroup>
        <Button color="secondary" onClick={()=>{onClick(TableTab.ABC)}} active={active===TableTab.ABC}>
          ABC
        </Button>
        <Button color="secondary" onClick={()=>{onClick(TableTab.ARC)}} active={active===TableTab.ARC}>
          ARC
        </Button>
        <Button color="secondary" onClick={()=>{onClick(TableTab.AGC)}} active={active===TableTab.AGC}>
          AGC
        </Button>
        <Button color="secondary" onClick={()=>{onClick(TableTab.OtherRatedContests)}} active={active===TableTab.OtherRatedContests}>
          Other Rated Contests
        </Button>
        <Button color="secondary" onClick={()=>{onClick(TableTab.OtherContests)}} active={active===TableTab.OtherContests}>
          Other Contests
        </Button>
      </ButtonGroup>
    </Row>
  );
}

const mapStateToProps = (state: State) => ({
  active: state.activeTableTab,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onClick: (active: TableTab) => dispatch(updateActiveTableTab(active))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TableTabButtons);
