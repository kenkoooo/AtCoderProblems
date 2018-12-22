import * as React from "react";
import { Row, Col } from "react-bootstrap";
import { Submission } from "../model/Submission";

export interface UserPageLanguagesProps {
  submissions: Array<Submission>;
}

export class UserPageLanguages extends React.Component<UserPageLanguagesProps> {
  constructor(props: UserPageLanguagesProps) {
    super(props);
  }

  render() {
    let map = new Map<string, Set<string>>();
    this.props.submissions
      .filter(submission => submission.result === "AC")
      .forEach(submission => {
        let language = submission.language.trim().replace(/\(.*?\)$/, "").trim().replace(/\d+$/, "");
        if (!map.has(language)) {
          map.set(language, new Set());
        }
        map.get(language).add(submission.problem_id);
      });

    return (
      <Row className="placeholders">
        {Array.from(map).map(entry => (
          <Col key={entry[0]} xs={6} sm={3}>
            <h4>{entry[0]}</h4>
            <h3>{entry[1].size}</h3>
            <span className="text-muted"></span>
          </Col>
        ))}
      </Row>
    );
  }
}
