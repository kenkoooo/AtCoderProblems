import React, { useMemo } from "react";
import { Row, ButtonGroup, Button } from "reactstrap";
import {
  ContestCategories,
  ContestCategory,
} from "../../utils/ContestClassifier";
import { isLikeContest } from "../../utils/LikeContestUtils";

interface Props {
  active: ContestCategory;
  setActive: (next: ContestCategory) => void;
  mergeLikeContest: boolean;
}

export const TableTabButtons: React.FC<Props> = (props) => {
  const { active, setActive, mergeLikeContest } = props;

  const filteredCategories = useMemo(() => {
    return ContestCategories.filter(
      (category) => !mergeLikeContest || !isLikeContest(category)
    );
  }, [mergeLikeContest]);

  return (
    <Row>
      <ButtonGroup className="table-tab">
        {filteredCategories.map((category) => (
          <Button
            key={category}
            color="secondary"
            onClick={(): void => {
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
