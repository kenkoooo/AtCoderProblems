import React from "react";
import { Row, ButtonGroup, Button } from "reactstrap";
import {
  ContestCategories,
  ContestCategory,
} from "../../utils/ContestClassifier";
import { getLikeContest } from "../../utils/LikeContestUtils";

interface Props {
  active: ContestCategory;
  setActive: (next: ContestCategory) => void;
  setSelectedContests: (contest: ContestCategory[]) => void;
  showLikeContest: boolean;
}

export const TableTabButtons: React.FC<Props> = (props) => {
  const { active, setActive, setSelectedContests, showLikeContest } = props;

  const resetSelectedContests = (category: ContestCategory) => {
    const selectContests = [category];
    const likeContest = getLikeContest(category);
    if (likeContest && showLikeContest) selectContests.push(likeContest);
    setSelectedContests(selectContests);
  };
  return (
    <Row>
      <ButtonGroup className="table-tab">
        {ContestCategories.map((category, i) => (
          <Button
            key={i}
            color="secondary"
            onClick={(): void => {
              setActive(category);
              resetSelectedContests(category);
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
