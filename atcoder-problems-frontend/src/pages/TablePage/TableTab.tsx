import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";


export class TableTab {
  ABC: boolean;
  ARC: boolean;
  AGC: boolean;
  OtherRatedContests: boolean;
  OtherContests: boolean;
  constructor(abc: boolean, arc: boolean, agc: boolean,
    otherratedcontests: boolean, othercontests: boolean){
      this.ABC = abc;
      this.ARC = arc;
      this.AGC = agc;
      this.OtherRatedContests = otherratedcontests;
      this.OtherContests = othercontests;
  }
}
interface Props {
  active: TableTab;
  setActive: (next: TableTab) => void;
}

const TableTabButtons: React.FC<Props> = props => {
  const { active, setActive } = props;
  return (
    <Row>
      <ButtonGroup>
        <Button
          color="secondary"
          onClick={() => {
            setActive(new TableTab(
              !active.ABC,
              active.ARC,
              active.AGC,
              active.OtherRatedContests,
              active.OtherContests
            ));
          }}
          active={active.ABC}
        >
          ABC
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(new TableTab(
              active.ABC,
              !active.ARC,
              active.AGC,
              active.OtherRatedContests,
              active.OtherContests
            ));
          }}
          active={active.ARC}
        >
          ARC
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(new TableTab(
              active.ABC,
              active.ARC,
              !active.AGC,
              active.OtherRatedContests,
              active.OtherContests
            ));
          }}
          active={active.AGC}
        >
          AGC
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(new TableTab(
              active.ABC,
              active.ARC,
              active.AGC,
              !active.OtherRatedContests,
              active.OtherContests
            ));
          }}
          active={active.OtherRatedContests}
        >
          Other Rated Contests
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(new TableTab(
              active.ABC,
              active.ARC,
              active.AGC,
              active.OtherRatedContests,
              !active.OtherContests
            ));
          }}
          active={active.OtherContests}
        >
          Other Contests
        </Button>
      </ButtonGroup>
    </Row>
  );
};

export default TableTabButtons;
