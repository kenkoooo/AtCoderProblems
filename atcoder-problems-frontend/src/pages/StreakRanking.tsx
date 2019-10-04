import React from "react";
import Ranking from "../components/Ranking";
import State from "../interfaces/State";
import { RankingEntry } from "../interfaces/RankingEntry";
import { List } from "immutable";
import { Dispatch } from "redux";
import { requestStreakRanking } from "../actions";
import { connect } from "react-redux";

interface Props {
  ranking: List<RankingEntry>;
  requestData: () => void;
}

class StreakRanking extends React.Component<Props> {
  componentDidMount(): void {
    this.props.requestData();
  }
  render() {
    return <Ranking title="Streak Ranking" ranking={this.props.ranking} />;
  }
}

const stateToProps = (state: State) => ({
  ranking: state.streakRanking.map(r => ({
    problem_count: r.streak,
    user_id: r.user_id
  }))
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => dispatch(requestStreakRanking())
});

export default connect(
  stateToProps,
  dispatchToProps
)(StreakRanking);
