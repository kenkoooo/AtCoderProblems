import React from "react";
import Ranking from "../components/Ranking";
import State from "../interfaces/State";
import { RankingEntry } from "../interfaces/RankingEntry";
import { List } from "immutable";
import { Dispatch } from "redux";
import { requestAcRanking } from "../actions";
import { connect } from "react-redux";

interface Props {
  ranking: List<RankingEntry>;
  requestData: () => void;
}

class ACRanking extends React.Component<Props> {
  componentDidMount(): void {
    this.props.requestData();
  }
  render() {
    return <Ranking title="AC Count Ranking" ranking={this.props.ranking} />;
  }
}

const stateToProps = (state: State) => ({
  ranking: state.acRanking
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => dispatch(requestAcRanking())
});

export default connect(
  stateToProps,
  dispatchToProps
)(ACRanking);
