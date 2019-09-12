import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";

export enum TableTab {
  ABC,
  ARC,
  AGC,
  OtherRatedContests,
  OtherContests
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
            setActive(TableTab.ABC);
          }}
          active={active === TableTab.ABC}
        >
          ABC
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(TableTab.ARC);
          }}
          active={active === TableTab.ARC}
        >
          ARC
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(TableTab.AGC);
          }}
          active={active === TableTab.AGC}
        >
          AGC
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(TableTab.OtherRatedContests);
          }}
          active={active === TableTab.OtherRatedContests}
        >
          Other Rated Contests
        </Button>
        <Button
          color="secondary"
          onClick={() => {
            setActive(TableTab.OtherContests);
          }}
          active={active === TableTab.OtherContests}
        >
          Other Contests
        </Button>
      </ButtonGroup>
    </Row>
  );
};

export default TableTabButtons;
