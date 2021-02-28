import React from "react";
import { List, Map as ImmutableMap } from "immutable";
import { Badge, Col, Row, UncontrolledTooltip } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import {
  caseInsensitiveUserId,
  isAccepted,
  ordinalSuffixOf,
} from "../../../utils";
import { formatMomentDate, getToday } from "../../../utils/DateUtil";
import { RankingEntry } from "../../../interfaces/RankingEntry";
import {
  cachedACRanking,
  cachedContestMap,
  cachedContestToProblemMap,
  cachedFastRanking,
  cachedFirstRanking,
  cachedProblemModels,
  cachedShortRanking,
  cachedStreaksRanking,
  cachedSumRanking,
  cachedUsersSubmissionMap,
} from "../../../utils/CachedApiClient";
import { isRatedContest } from "../../TablePage/ContestClassifier";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import Contest from "../../../interfaces/Contest";
import Submission from "../../../interfaces/Submission";
import ProblemModel, {
  isProblemModelWithTimeModel,
} from "../../../interfaces/ProblemModel";
import { calculateTopPlayerEquivalentEffort } from "../../../utils/ProblemModelUtil";
import Problem from "../../../interfaces/Problem";
import * as UserUtils from "../UserUtils";
import { calcStreak, countUniqueAcByDate } from "../../../utils/StreakCounter";
import { convertMap } from "../../../utils/ImmutableMigration";

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

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  contestsFetch: PromiseState<ImmutableMap<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<ImmutableMap<ContestId, List<Problem>>>;
  submissionsMapFetch: PromiseState<ImmutableMap<string, List<Submission>>>;
  problemModelsFetch: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
  shortestRanking: PromiseState<RankingEntry[]>;
  fastestRanking: PromiseState<RankingEntry[]>;
  firstRanking: PromiseState<RankingEntry[]>;
  cachedACRankingFetch: PromiseState<RankingEntry[]>;
  cachedSumRankingFetch: PromiseState<RankingEntry[]>;
  cachedStreaksRanking: PromiseState<RankingEntry[]>;
}

const InnerAchievementBlock: React.FC<InnerProps> = (props) => {
  const contests = props.contestsFetch.fulfilled
    ? props.contestsFetch.value
    : ImmutableMap<ContestId, Contest>();
  const contestToProblems = props.contestToProblemsFetch.fulfilled
    ? props.contestToProblemsFetch.value
    : ImmutableMap<ContestId, List<Problem>>();
  const submissionsMap = props.submissionsMapFetch.fulfilled
    ? convertMap(props.submissionsMapFetch.value.map((list) => list.toArray()))
    : new Map<ProblemId, Submission[]>();
  const problemModels = props.problemModelsFetch.fulfilled
    ? props.problemModelsFetch.value
    : ImmutableMap<ProblemId, ProblemModel>();

  const userSubmissions = UserUtils.userSubmissions(
    submissionsMap,
    props.userId
  );
  const dailyCount = countUniqueAcByDate(userSubmissions);
  const { longestStreak, currentStreak, prevDateLabel } = calcStreak(
    dailyCount
  );

  const shortRanking = props.shortestRanking.fulfilled
    ? props.shortestRanking.value
    : ([] as RankingEntry[]);
  const fastRanking = props.fastestRanking.fulfilled
    ? props.fastestRanking.value
    : ([] as RankingEntry[]);
  const firstRanking = props.firstRanking.fulfilled
    ? props.firstRanking.value
    : ([] as RankingEntry[]);

  const solvedProblemIds = UserUtils.solvedProblemIds(submissionsMap);

  const solvedCount = solvedProblemIds.length;
  const acRank = props.cachedACRankingFetch.fulfilled
    ? props.cachedACRankingFetch.value.filter(
        (entry) => entry.problem_count > solvedCount
      ).length
    : undefined;
  const shortRank = findFromRanking(shortRanking, props.userId);
  const firstRank = findFromRanking(firstRanking, props.userId);
  const fastRank = findFromRanking(fastRanking, props.userId);

  const ratedProblemIds = new Set(
    contests
      .valueSeq()
      .flatMap((contest) => {
        const isRated = isRatedContest(contest);
        const contestProblems = contestToProblems.get(contest.id);
        return isRated && contestProblems ? contestProblems : [];
      })
      .map((problem) => problem.id)
  );
  const acceptedRatedSubmissions = Array.from(submissionsMap.values())
    .flatMap((a) => a)
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
  const sumRank = props.cachedSumRankingFetch.fulfilled
    ? props.cachedSumRankingFetch.value.filter(
        (entry) => entry.problem_count > ratedPointSum
      ).length
    : undefined;

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
  const longestStreakRank = props.cachedStreaksRanking.fulfilled
    ? props.cachedStreaksRanking.value.filter(
        (e) => e.problem_count > longestStreak
      ).length
    : undefined;

  const streakSum = dailyCount.length;

  const topPlayerEquivalentEffort = solvedProblemIds
    .map((problemId: ProblemId) => problemModels.get(problemId))
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

export const AchievementBlock = connect<OuterProps, InnerProps>((props) => ({
  contestsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<ContestId, Contest>> => cachedContestMap(),
  },
  contestToProblemsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<ContestId, List<Problem>>> =>
      cachedContestToProblemMap(),
  },
  submissionsMapFetch: {
    comparison: props.userId,
    value: (): Promise<ImmutableMap<string, List<Submission>>> =>
      cachedUsersSubmissionMap(List([props.userId])),
  },
  problemModelsFetch: {
    comparison: null,
    value: (): Promise<ImmutableMap<ProblemId, ProblemModel>> =>
      cachedProblemModels(),
  },
  shortestRanking: {
    comparison: null,
    value: (): Promise<RankingEntry[]> =>
      cachedShortRanking().then((list) => list.toArray()),
  },
  fastestRanking: {
    comparison: null,
    value: (): Promise<RankingEntry[]> =>
      cachedFastRanking().then((list) => list.toArray()),
  },
  firstRanking: {
    comparison: null,
    value: (): Promise<RankingEntry[]> =>
      cachedFirstRanking().then((list) => list.toArray()),
  },
  cachedACRankingFetch: {
    comparison: null,
    value: (): Promise<RankingEntry[]> => cachedACRanking(),
  },
  cachedSumRankingFetch: {
    comparison: null,
    value: (): Promise<RankingEntry[]> => cachedSumRanking(),
  },
  cachedStreaksRanking: {
    comparison: null,
    value: (): Promise<RankingEntry[]> => cachedStreaksRanking(),
  },
}))(InnerAchievementBlock);
