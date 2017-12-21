import * as React from "react";
import { LangCount } from "../model/LangCount";
import { ApiCall } from "../utils/ApiCall";
import { Row, Col, PageHeader } from "react-bootstrap";

interface UserPageLanguagesStates {
  counts: Array<LangCount>;
}

export interface UserPageLanguagesProps {
  userId: string;
}

export class UserPageLanguages extends React.Component<
  UserPageLanguagesProps,
  UserPageLanguagesStates
> {
  constructor(props: UserPageLanguagesProps) {
    super(props);
    this.state = { counts: [] };
  }

  componentWillMount() {
    ApiCall.getLanguageCounts()
      .then(counts => this.setState({ counts: counts }))
      .catch(err => console.error(err));
  }

  render() {
    let counts = this.state.counts.filter(c => c.userId === this.props.userId);

    let languageCountMap = new Map<string, number>();
    let languageRankMap = new Map<string, number>();
    counts.forEach(c => {
      languageRankMap.set(c.language, 0);
      languageCountMap.set(c.language, c.count);
    });

    this.state.counts
      .filter(
        c =>
          languageCountMap.has(c.language) &&
          languageCountMap.get(c.language) < c.count
      )
      .forEach(c =>
        languageRankMap.set(c.language, languageRankMap.get(c.language) + 1)
      );

    let rankFormat = (i: number) => {
      if (i % 10 == 1) {
        return `${i}st`;
      } else if (i % 10 == 2) {
        return `${i}nd`;
      } else if (i % 10 == 3) {
        return `${i}rd`;
      } else {
        return `${i}th`;
      }
    };

    return (
      <Row className="placeholders">
        {counts.map(c => (
          <Col key={c.language} xs={6} sm={3}>
            <h4>{c.language}</h4>
            <h3>{languageCountMap.get(c.language)}</h3>
            <span className="text-muted">
              {rankFormat(languageRankMap.get(c.language) + 1)}
            </span>
          </Col>
        ))}
      </Row>
    );
  }
}
