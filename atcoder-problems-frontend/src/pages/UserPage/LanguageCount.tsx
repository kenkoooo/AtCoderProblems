import React from "react";
import { Row, Col } from "reactstrap";
import Submission from "../../interfaces/Submission";
import { isAccepted } from "../../utils";

const LanguageCount = ({ submissions }: { submissions: Submission[] }) => {
  const languageMap = submissions
    .filter(s => isAccepted(s.result))
    .reduce((map, submission) => {
      const language = /^Perl6/.test(submission.language) ? "Perl6" : submission.language.replace(/\d* \(.*\)$/, "");
      const problems = map.get(language);
      if (problems) {
        problems.add(submission.problem_id);
      } else {
        map.set(language, new Set([submission.problem_id]));
      }
      return map;
    }, new Map<string, Set<string>>());
  const languageCount = Array.from(languageMap)
    .map(([language, set]) => ({ language, count: set.size }))
    .sort((a, b) => a.language.localeCompare(b.language));
  return (
    <Row>
      {languageCount.map(({ language, count }) => (
        <Col key={language} className="text-center my-3" md="3" xs="6">
          <h6>{language}</h6>
          <h3>{count}</h3>
        </Col>
      ))}
    </Row>
  );
};

export default LanguageCount;
