import React from "react";
import { connect, PromiseState } from "react-refetch";
import { Row, Col } from "reactstrap";
import Submission from "../../interfaces/Submission";
import { ProblemId } from "../../interfaces/Status";
import { isAccepted } from "../../utils";
import { normalizeLanguage } from "../../utils/LanguageNormalizer";
import { groupBy } from "../../utils/GroupBy";
import { countUniqueAcByDate, calcStreak } from "../../utils/StreakCounter";
import { formatMomentDate, getToday } from "../../utils/DateUtil";
import { cachedSubmissions } from "../../utils/CachedApiClient";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  submissionsFetch: PromiseState<Submission[]>;
}

const InnerLanguageCount: React.FC<InnerProps> = (props) => {
  const submissions = props.submissionsFetch.fulfilled
    ? props.submissionsFetch.value
    : [];

  const submissionsByLanguage = groupBy(submissions, (s) =>
    normalizeLanguage(s.language)
  );

  const languageMap = new Map<
    string,
    {
      problems: Set<ProblemId>;
      dailyCount: { dateLabel: string; count: number }[];
    }
  >();
  Array.from(submissionsByLanguage).forEach(([language, submissions]) => {
    const acceptedSet = submissions
      .filter((s) => isAccepted(s.result))
      .reduce((set, submission) => {
        set.add(submission.problem_id);
        return set;
      }, new Set<ProblemId>());
    if (acceptedSet.size > 0) {
      languageMap.set(language, {
        problems: acceptedSet,
        dailyCount: countUniqueAcByDate(submissions),
      });
    }
  });

  const languageCountStreak = Array.from(languageMap)
    .map(([language, elm]) => ({
      language,
      count: elm.problems.size,
      ...calcStreak(elm.dailyCount),
    }))
    .sort((a, b) => a.language.localeCompare(b.language));
  const yesterdayLabel = formatMomentDate(getToday().add(-1, "day"));

  return (
    <Row>
      {languageCountStreak.map(
        ({ language, count, longestStreak, currentStreak, prevDateLabel }) => {
          const isIncreasing = prevDateLabel >= yesterdayLabel;
          return (
            <Col key={language} className="text-center my-3" md="3" xs="6">
              <h6>{language}</h6>
              <h3>{count}</h3>
              <h6 className="text-muted">
                Longest Streak: {longestStreak} days
              </h6>
              <h6 className="text-muted">
                Current Streak: {isIncreasing ? currentStreak : 0} days
              </h6>
              <h6 className="text-muted">Last AC: {prevDateLabel}</h6>
            </Col>
          );
        }
      )}
    </Row>
  );
};

export const LanguageCount = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: cachedSubmissions(userId).then((list) => list.toArray()),
  },
}))(InnerLanguageCount);
