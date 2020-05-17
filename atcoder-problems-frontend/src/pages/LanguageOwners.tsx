import React, { useState } from "react";
import { Row, Col, ButtonGroup, Button } from "reactstrap";

import { connect, PromiseState } from "react-refetch";
import { LangRankingEntry } from "../interfaces/RankingEntry";
import { List, Map } from "immutable";
import { ordinalSuffixOf } from "../utils";
import * as CachedApiClient from "../utils/CachedApiClient";

interface OneOwnerProps {
  language: string;
  ranking: List<LangRankingEntry>;
  size: number;
}

const OneOwner: React.FC<OneOwnerProps> = props => (
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

const OWNERS_NUM_OPTIONS = [3, 5, 10, 20];

interface Props {
  rankingFetch: PromiseState<Map<string, List<LangRankingEntry>>>;
}

const LanguageOwners: React.FC<Props> = props => {
  const [ownersNum, setOwnersNum] = useState(3);

  const ranking = props.rankingFetch.fulfilled
    ? props.rankingFetch.value
    : Map<string, List<LangRankingEntry>>();
  return (
    <>
      <div className="clearfix">
        <ButtonGroup className="float-right">
          {OWNERS_NUM_OPTIONS.map(option => (
            <Button
              key={option}
              color="secondary"
              onClick={(): void => setOwnersNum(option)}
              active={ownersNum === option}
            >
              {option}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div>
        {ranking
          .sortBy((value, key) => key)
          .map((list, language) => (
            <OneOwner
              key={language}
              language={language}
              ranking={list}
              size={ownersNum}
            />
          ))
          .valueSeq()
          .toArray()}
      </div>
    </>
  );
};

export default connect<{}, Props>(() => ({
  rankingFetch: {
    comparison: null,
    value: (): Promise<Map<string, List<LangRankingEntry>>> =>
      CachedApiClient.cachedLangRanking()
  }
}))(LanguageOwners);
