import React from "react";
import Ranking from "../components/Ranking";
import State from "../interfaces/State";
import { getShortRanking } from "../utils/Api";
import { List } from "immutable";
import { RankingEntry } from "../interfaces/RankingEntry";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { requestMergedProblems } from "../actions";

interface Props {
  ranking: List<RankingEntry>;
  requestData: () => void;
}

class ShortRanking extends React.Component<Props> {
  componentDidMount(): void {
    this.props.requestData();
  }

  render() {
    return <Ranking title={"Top Golfers"} ranking={this.props.ranking} />;
  }
}

const stateToProps = (state: State) => ({
  ranking: getShortRanking(state.mergedProblems.toList())
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => dispatch(requestMergedProblems())
});

export default connect(
  stateToProps,
  dispatchToProps
)(ShortRanking);
