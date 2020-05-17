import React, { useState } from "react";
import { ButtonGroup, Button, Row } from "reactstrap";

import { Map } from "immutable";
import { ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import { isAccepted } from "../../../utils";
import CalendarHeatmap from "../../../components/CalendarHeatmap";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";

type FilterStatus = "AC" | "Submissions" | "Unique AC";

interface Props {
  submissions: Submission[];
}

export const filterSubmissions = (
  submissions: Submission[],
  filterStatus: FilterStatus
): Submission[] => {
  switch (filterStatus) {
    case "Submissions":
      return submissions;
    case "AC":
      return submissions.filter(s => isAccepted(s.result));
    case "Unique AC":
      return submissions
        .filter(s => isAccepted(s.result))
        .sort((a, b) => a.epoch_second - b.epoch_second)
        .reduce(
          (map, s) => map.set(s.problem_id, map.get(s.problem_id, s)),
          Map<ProblemId, Submission>()
        )
        .valueSeq()
        .toArray();
  }
};

const formatTooltip = (
  date: string,
  count: number,
  filter: FilterStatus
): string => {
  if (filter === "Submissions") {
    if (count === 1) {
      return `${date} ${count} submission`;
    } else {
      return `${date} ${count} submissions`;
    }
  } else {
    return `${date} ${count} ${filter}`;
  }
};

export const FilteringHeatmap: React.FC<Props> = props => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Submissions");
  const { submissions } = props;
  const filteredSubmissions = filterSubmissions(submissions, filterStatus);

  return (
    <div>
      <Row className="my-3">
        <ButtonGroup>
          <Button
            onClick={(): void => setFilterStatus("Submissions")}
            active={filterStatus === "Submissions"}
          >
            All Submissions
          </Button>
          <Button
            onClick={(): void => setFilterStatus("AC")}
            active={filterStatus === "AC"}
          >
            All AC
          </Button>
          <Button
            onClick={(): void => setFilterStatus("Unique AC")}
            active={filterStatus === "Unique AC"}
          >
            Unique AC
          </Button>
        </ButtonGroup>
      </Row>
      <Row className="my-5">
        <CalendarHeatmap
          dateLabels={filteredSubmissions.map(s =>
            formatMomentDate(parseSecond(s.epoch_second))
          )}
          formatTooltip={(date: string, count: number): string =>
            formatTooltip(date, count, filterStatus)
          }
        />
      </Row>
    </div>
  );
};
