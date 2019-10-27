import React from "react";
import { Row, Col, ButtonGroup, Button } from "reactstrap";

import { LangRankingEntry } from "../interfaces/RankingEntry";
import { List, Map } from "immutable";
import State from "../interfaces/State";
import { Dispatch } from "redux";
import { requestLangRanking } from "../actions";
import { connect } from "react-redux";
import { ordinalSuffixOf } from "../utils";

const OneOwner = (props: {
  language: string;
  ranking: List<LangRankingEntry>;
  size: number;
}) => (
  <div>
    <Row className="justify-content-center my-2 border-bottom">
      <h1>{props.language}</h1>
    </Row>
    <Row>
      {props.ranking.slice(0, props.size).map(({ user_id, count }, rank) => (
        <Col key={user_id} className="text-center">
          <h5>{`${rank + 1}${ordinalSuffixOf(rank + 1)}`}</h5>
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

interface LocalState {
  ownersNum: number;
  ownersNumOptions: number[];
}

class LanguageOwners extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      ownersNum: 3,
      ownersNumOptions: [3, 5, 10, 20]
    };
  }

  componentDidMount() {
    this.props.requestData();
  }

  render() {
    return (
      <div>
        <ButtonGroup>
          {this.state.ownersNumOptions.map(option => (
            <Button
              key={option}
              color="secondary"
              onClick={() => this.setState({ ownersNum: option })}
              active={this.state.ownersNum === option}
            >
              {option}
            </Button>
          ))}
        </ButtonGroup>
        {this.props.ranking
          .sortBy((value, key) => key)
          .map((list, language) => (
            <OneOwner
              key={language}
              language={language}
              ranking={list}
              size={this.state.ownersNum}
            />
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
