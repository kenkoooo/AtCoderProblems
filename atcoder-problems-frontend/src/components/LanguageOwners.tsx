import * as React from "react";
import { LangCount } from "../model/LangCount";
import { ApiCall } from "../utils/ApiCall";
import { Row, Col, PageHeader } from "react-bootstrap";

interface LanguageOwnersState {
  counts: Array<LangCount>;
}

export interface LanguageOwnersProps {}

export class LanguageOwners extends React.Component<
  LanguageOwnersProps,
  LanguageOwnersState
> {
  constructor(props: LanguageOwnersProps) {
    super(props);
    this.state = { counts: [] };
  }

  componentWillMount() {
    ApiCall.getLanguageCounts()
      .then(counts => this.setState({ counts: counts }))
      .catch(err => console.error(err));
  }

  render() {
    let langs = Array.from(new Set(this.state.counts.map(c => c.language)));
    let langMap = new Map<string, Array<LangCount>>();
    langs.forEach(lang => langMap.set(lang, []));

    this.state.counts.forEach(count => langMap.get(count.language).push(count));
    let rankLabels = ["1st", "2nd", "3rd"];

    return (
      <Row>
        {langs.map(lang => (
          <Row className="placeholders">
            <PageHeader>{lang}</PageHeader>
            {langMap
              .get(lang)
              .sort((a, b) => b.count - a.count)
              .slice(0, 3)
              .map((count, rank) => (
                <Col key={count.user_id} xs={4} sm={4}>
                  <h4>{rankLabels[rank]}</h4>
                  <h3>{count.user_id}</h3>
                  <span className="text-muted">{count.count} AC</span>
                </Col>
              ))}
          </Row>
        ))}
      </Row>
    );
  }
}
