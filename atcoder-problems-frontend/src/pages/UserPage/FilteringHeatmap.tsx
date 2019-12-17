import React from "react";
import { ButtonGroup, Button, Row } from "reactstrap";

import CalendarHeatmap from "../../components/CalendarHeatmap";
import Submission from "../../interfaces/Submission";
import { isAccepted } from "../../utils";
import { formatMoment, parseSecond } from "../../utils/DateUtil";
import { Map } from "immutable";
import { ProblemId } from "../../interfaces/Status";

type FilterStatus = "AC" | "Submissions" | "Unique AC";

interface Props {
  submissions: Submission[];
}

interface State {
  filterStatus: FilterStatus;
}

export const filterSubmissions = (
  submissions: Submission[],
  filterStatus: FilterStatus
) => {
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

class FilteringHeatmap extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      filterStatus: "Submissions"
    };
  }

  render() {
    const { submissions } = this.props;
    const { filterStatus } = this.state;
    const filteredSubmissions = filterSubmissions(submissions, filterStatus);

    return (
      <div>
        <Row className="my-3">
          <ButtonGroup>
            <Button
              onClick={() => this.setState({ filterStatus: "Submissions" })}
              active={filterStatus === "Submissions"}
            >
              All Submissions
            </Button>
            <Button
              onClick={() => this.setState({ filterStatus: "AC" })}
              active={filterStatus === "AC"}
            >
              All AC
            </Button>
            <Button
              onClick={() => this.setState({ filterStatus: "Unique AC" })}
              active={filterStatus === "Unique AC"}
            >
              Unique AC
            </Button>
          </ButtonGroup>
        </Row>
        <Row className="my-5">
          <CalendarHeatmap
            dateLabels={filteredSubmissions.map(s =>
              formatMoment(parseSecond(s.epoch_second))
            )}
            formatTooltip={(date: string, count: number) =>
              `${date} ${count} ${filterStatus}`
            }
          />
        </Row>
      </div>
    );
  }
}

export default FilteringHeatmap;
