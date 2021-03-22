import React, { useState } from "react";
import { Row, Col, ButtonGroup, Button } from "reactstrap";

import { useLangRanking } from "../api/APIClient";
import { LangRankingEntry } from "../interfaces/RankingEntry";
import { ordinalSuffixOf } from "../utils";

interface OneOwnerProps {
  language: string;
  ranking: LangRankingEntry[];
  size: number;
}

const OneOwner: React.FC<OneOwnerProps> = (props) => (
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

export const LanguageOwners = () => {
  const [ownersNum, setOwnersNum] = useState(3);
  const rankingMap =
    useLangRanking().data ?? new Map<string, LangRankingEntry[]>();
  const ranking = Array.from(
    rankingMap.entries()
  ).map(([language, entries]) => ({ language, entries }));
  ranking.sort((a, b) => a.language.localeCompare(b.language));

  return (
    <>
      <div className="clearfix">
        <ButtonGroup className="float-right">
          {OWNERS_NUM_OPTIONS.map((option) => (
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
        {ranking.map(({ entries, language }) => (
          <OneOwner
            key={language}
            language={language}
            ranking={entries}
            size={ownersNum}
          />
        ))}
      </div>
    </>
  );
};
