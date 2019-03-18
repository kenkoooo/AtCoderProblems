import React from "react";
import { ButtonGroup, Button, Row } from "reactstrap";

import CalendarHeatmap from "../../components/CalendarHeatmap";
import Submission from "../../interfaces/Submission";
import { isAccepted } from "../../utils";

enum FilterStatus {
  AllSubmissions,
  AllAccepted,
  UniqueAccepted
}

interface Props {
  submissions: Submission[];
}

interface State {
  filter_status: FilterStatus;
}

class FilteringHeatmap extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      filter_status: FilterStatus.AllSubmissions
    };
  }

  render() {
    const filtered_submissions = ((filter_status: FilterStatus) => {
      switch (filter_status) {
        case FilterStatus.AllSubmissions:
          return this.props.submissions;
        case FilterStatus.AllAccepted:
          return this.props.submissions.filter(s => isAccepted(s.result));
        case FilterStatus.UniqueAccepted:
          const map = this.props.submissions
            .filter(s => isAccepted(s.result))
            .sort((a, b) => b.epoch_second - a.epoch_second)
            .reduce(
              (map, s) => map.set(s.problem_id, s),
              new Map<string, Submission>()
            );
          return Array.from(map.values());
        default:
          throw "unreachable";
      }
    })(this.state.filter_status);

    return (
      <div>
        <Row className="my-2">
          <ButtonGroup>
            <Button
              onClick={() =>
                this.setState({ filter_status: FilterStatus.AllSubmissions })
              }
              active={this.state.filter_status === FilterStatus.AllSubmissions}
            >
              All Submissions
            </Button>
            <Button
              onClick={() =>
                this.setState({ filter_status: FilterStatus.AllAccepted })
              }
              active={this.state.filter_status === FilterStatus.AllAccepted}
            >
              All AC
            </Button>
            <Button
              onClick={() =>
                this.setState({ filter_status: FilterStatus.UniqueAccepted })
              }
              active={this.state.filter_status === FilterStatus.UniqueAccepted}
            >
              Unique AC
            </Button>
          </ButtonGroup>
        </Row>
        <Row>
          <CalendarHeatmap
            data={filtered_submissions.map(
              s => new Date(s.epoch_second * 1000)
            )}
            formatTooltip={(date: string, count: number) => {
              let unit = "";
              if (this.state.filter_status === FilterStatus.AllAccepted) {
                unit = "AC";
              } else if (
                this.state.filter_status == FilterStatus.AllSubmissions
              ) {
                unit = "Submissions";
              } else {
                unit = "Unique AC";
              }
              return `${date} ${count} ${unit}`;
            }}
          />
        </Row>
      </div>
    );
  }
}

export default FilteringHeatmap;
