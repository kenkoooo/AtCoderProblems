import React from "react";
import { Badge, Col, Row, UncontrolledTooltip } from "reactstrap";
import {
  useUserACRank,
  useContests,
  useContestToProblems,
  useFastRanking,
  useFirstRanking,
  useProblemModelMap,
  useShortRanking,
  useUserStreakRank,
  useUserSumRank,
  useUserSubmission,
} from "../../../api/APIClient";
import {
  caseInsensitiveUserId,
  isAccepted,
  ordinalSuffixOf,
} from "../../../utils";
import { formatMomentDate, getToday } from "../../../utils/DateUtil";
import { RankingEntry } from "../../../interfaces/RankingEntry";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import ProblemModel, {
  isProblemModelWithTimeModel,
} from "../../../interfaces/ProblemModel";
import { calculateTopPlayerEquivalentEffort } from "../../../utils/ProblemModelUtil";
import Problem from "../../../interfaces/Problem";
import * as UserUtils from "../UserUtils";
import { calcStreak, countUniqueAcByDate } from "../../../utils/StreakCounter";
import { isRatedContest } from "../../../utils/ContestClassifier";

const findFromRanking = (
  ranking: RankingEntry[],
  userId: string
): {
  rank: number;
  count: number;
} => {
  const entry = ranking
    .sort((a, b) => b.problem_count - a.problem_count)
    .find((r) => caseInsensitiveUserId(r.user_id) === userId);
  if (entry) {
    const count = entry.problem_count;
    const rank = ranking.filter((e) => e.problem_count > count).length;
    return { rank, count };
  } else {
    return { rank: ranking.length, count: 0 };
  }
};

interface Props {
  userId: string;
}

export const AchievementBlock: React.FC<Props> = (props) => {
  const contests = useContests().data ?? [];
  const contestToProblems =
    useContestToProblems() ?? new Map<ContestId, Problem[]>();
  const userSubmissions = useUserSubmission(props.userId) ?? [];
  const problemModels = useProblemModelMap();
  const dailyCount = countUniqueAcByDate(userSubmissions);
  const { longestStreak, currentStreak, prevDateLabel } = calcStreak(
    dailyCount
  );
  const shortRanking = useShortRanking() ?? [];
  const fastRanking = useFastRanking() ?? [];
  const firstRanking = useFirstRanking() ?? [];

  const solvedProblemIds = UserUtils.solvedProblemIdsFromArray(userSubmissions);
  const solvedCount = solvedProblemIds.length;
  const acRankEntry = useUserACRank(props.userId);
  const acRank = acRankEntry.data?.rank;
  const shortRank = findFromRanking(shortRanking, props.userId);
  const firstRank = findFromRanking(firstRanking, props.userId);
  const fastRank = findFromRanking(fastRanking, props.userId);

  const ratedProblemIds = new Set(
    contests
      .flatMap((contest) => {
        const isRated = isRatedContest(contest);
        const contestProblems = contestToProblems.get(contest.id);
        return isRated && contestProblems ? contestProblems : [];
      })
      .map((problem) => problem.id)
  );
  const acceptedRatedSubmissions = userSubmissions
    .filter((s) => isAccepted(s.result))
    .filter((s) => ratedProblemIds.has(s.problem_id));
  acceptedRatedSubmissions.sort((a, b) => a.id - b.id);
  const ratedPointMap = new Map<ProblemId, number>();
  acceptedRatedSubmissions.forEach((s) => {
    ratedPointMap.set(s.problem_id, s.point);
  });
  const ratedPointSum = Array.from(ratedPointMap.values()).reduce(
    (sum, point) => sum + point,
    0
  );
  const sumRankEntry = useUserSumRank(props.userId);
  const sumRank = sumRankEntry.data?.rank;

  const achievements = [
    {
      key: "Accepted",
      value: solvedCount,
      rank: acRank,
    },
    {
      key: "Shortest Code",
      value: shortRank.count,
      rank: shortRank.rank,
    },
    {
      key: "Fastest Code",
      value: fastRank.count,
      rank: fastRank.rank,
    },
    {
      key: "First AC",
      value: firstRank.count,
      rank: firstRank.rank,
    },
    {
      key: "Rated Point Sum",
      value: ratedPointSum,
      rank: sumRank,
    },
  ];

  const yesterdayLabel = formatMomentDate(getToday().add(-1, "day"));
  const isIncreasing = prevDateLabel >= yesterdayLabel;
  const streakRankEntry = useUserStreakRank(props.userId);
  const longestStreakRank = streakRankEntry.data?.rank;

  const streakSum = dailyCount.length;

  const topPlayerEquivalentEffort = solvedProblemIds
    .map((problemId: ProblemId) => problemModels?.get(problemId))
    .filter((model: ProblemModel | undefined) => model !== undefined)
    .filter(isProblemModelWithTimeModel)
    .map(calculateTopPlayerEquivalentEffort)
    .reduce((a: number, b: number) => a + b, 0);

  return (
    <>
      <Row className="my-2 border-bottom">
        <h1>Achievement</h1>
      </Row>
      <Row className="my-3">
        {achievements.map(({ key, value, rank }) => (
          <Col key={key} className="text-center" xs="6" md="3">
            <h6>{key}</h6>
            <h3>{value}</h3>
            <h6 className="text-muted">
              {rank !== undefined
                ? `${rank + 1}${ordinalSuffixOf(rank + 1)}`
                : ""}
            </h6>
          </Col>
        ))}
        <Col key="Longest Streak" className="text-center" xs="6" md="3">
          <h6>
            Longest Streak{" "}
            <Badge pill id="longestStreakTooltip">
              ?
            </Badge>
            <UncontrolledTooltip
              target="longestStreakTooltip"
              placement="right"
            >
              The longest streak is based on{" "}
              <strong>Japan Standard Time</strong> (JST, UTC+9).
            </UncontrolledTooltip>
          </h6>
          <h3>{longestStreak} days</h3>
          <h6 className="text-muted">
            {longestStreakRank !== undefined
              ? `${longestStreakRank + 1}${ordinalSuffixOf(
                  longestStreakRank + 1
                )}`
              : ""}
          </h6>
        </Col>
        <Col key="Current Streak" className="text-center" xs="6" md="3">
          <h6>
            Current Streak{" "}
            <Badge pill id="currentStreakTooltip">
              ?
            </Badge>
            <UncontrolledTooltip
              target="currentStreakTooltip"
              placement="right"
            >
              The current streak is based on <strong>Local Time</strong>.
            </UncontrolledTooltip>
          </h6>
          <h3>{isIncreasing ? currentStreak : 0} days</h3>
          <h6 className="text-muted">{`Last AC: ${prevDateLabel}`}</h6>
        </Col>
        <Col key="Streak Sum" className="text-center" xs="6" md="3">
          <h6>Streak Sum</h6>
          <h3>{streakSum} days</h3>
        </Col>
        <Col key="TEE" className="text-center" xs="6" md="3">
          <h6>
            TEE{" "}
            <Badge pill id="teeToolTip">
              ?
            </Badge>
            <UncontrolledTooltip target="teeToolTip" placement="right">
              <strong>Top player-Equivalent Effort</strong>. The estimated time
              in seconds required for a contestant with 4000 rating to solve all
              the problems this contestant have solved.
            </UncontrolledTooltip>
          </h6>
          <h3>{Math.round(topPlayerEquivalentEffort)}</h3>
        </Col>
        <Col />
      </Row>
    </>
  );
};
