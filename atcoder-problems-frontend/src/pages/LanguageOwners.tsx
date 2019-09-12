import React from "react";
import { Row, Col } from "reactstrap";

import { LangRankingEntry } from "../interfaces/RankingEntry";
import { List, Map } from "immutable";
import State from "../interfaces/State";
import { Dispatch } from "redux";
import { requestLangRanking } from "../actions";
import { connect } from "react-redux";

const ordinalNumbers = ["1st", "2nd", "3rd"];

const OneOwner = (props: {
  language: string;
  ranking: List<LangRankingEntry>;
}) => (
  <div>
    <Row className="justify-content-center my-2 border-bottom">
      <h1>{props.language}</h1>
    </Row>
    <Row>
      {props.ranking.slice(0, 3).map(({ user_id, count }, i) => (
        <Col key={user_id} className="text-center">
          <h5>{ordinalNumbers[i]}</h5>
          <h3>{user_id}</h3>
          <h5 className="text-muted">{count} AC</h5>
        </Col>
      ))}
    </Row>
  </div>
);

interface Props {
  ranking: Map<string, List<LangRankingEntry>>;
  requestData: () => void;
}

class LanguageOwners extends React.Component<Props> {
  componentDidMount() {
    this.props.requestData();
  }

  render() {
    return (
      <div>
        {this.props.ranking
          .sortBy((value, key) => key)
          .map((list, language) => (
            <OneOwner key={language} language={language} ranking={list} />
          ))
          .valueSeq()
          .toArray()}
      </div>
    );
  }
}

const stateToProps = (state: State) => ({
  ranking: state.langRanking
    .reduce(
      (map, entry) =>
        map.update(entry.language, List<LangRankingEntry>(), list =>
          list.push(entry)
        ),
      Map<string, List<LangRankingEntry>>()
    )
    .map(list => list.sort((a, b) => b.count - a.count))
});
const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => dispatch(requestLangRanking())
});

export default connect(
  stateToProps,
  dispatchToProps
)(LanguageOwners);
