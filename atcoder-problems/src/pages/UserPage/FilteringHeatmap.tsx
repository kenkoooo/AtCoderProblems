import React from "react";

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
  user_id: string;
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
      <CalendarHeatmap
        data={filtered_submissions.map(s => new Date(s.epoch_second * 1000))}
      />
    );
  }
}

export default FilteringHeatmap;
