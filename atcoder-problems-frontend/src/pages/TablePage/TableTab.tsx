import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";
import {
  ContestCategories,
  ContestCategory,
} from "../../utils/ContestClassifier";
import { LikeContestCategories } from "../../utils/LikeContestUtils";

interface Props {
  active: ContestCategory;
  setActive: (next: ContestCategory) => void;
  mergeLikeContest: boolean;
}

export const TableTabButtons: React.FC<Props> = (props) => {
  const { active, setActive, mergeLikeContest } = props;

  const filterLikeContest = (contestCategories: readonly ContestCategory[]) => {
    if (!mergeLikeContest) return contestCategories;

    return contestCategories.filter(
      (category) => !LikeContestCategories.includes(category)
    );
  };
  return (
    <Row>
      <ButtonGroup className="table-tab">
        {filterLikeContest(ContestCategories).map((category, i) => (
          <Button
            key={String(i)}
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
