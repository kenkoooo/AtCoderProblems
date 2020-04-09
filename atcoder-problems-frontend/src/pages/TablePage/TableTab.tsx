import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";
import { ContestCategories, ContestCategory } from "./ContestClassifier";

interface Props {
  active: ContestCategory;
  setActive: (next: ContestCategory) => void;
}

export const TableTabButtons: React.FC<Props> = props => {
  const { active, setActive } = props;
  return (
    <Row>
      <ButtonGroup className="table-tab">
        {ContestCategories.map((category, i) => (
          <Button
            key={i}
            color="secondary"
            onClick={() => {
              setActive(category);
            }}
            active={active === category}
          >
            {category}
          </Button>
        ))}
      </ButtonGroup>
    </Row>
  );
};
