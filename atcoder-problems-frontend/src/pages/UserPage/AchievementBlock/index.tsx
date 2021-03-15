import React from "react";
import { List } from "immutable";
import { Badge, Col, Row, UncontrolledTooltip } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import {
  useACRanking,
  useStreakRanking,
  useSumRanking,
} from "../../../api/APIClient";
import {
  caseInsensitiveUserId,
  isAccepted,
  ordinalSuffixOf,
} from "../../../utils";
import { formatMomentDate, getToday } from "../../../utils/DateUtil";
import { RankingEntry } from "../../../interfaces/RankingEntry";
import * as CachedApiClient from "../../../utils/CachedApiClient";
import * as ImmutableMigration from "../../../utils/ImmutableMigration";
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
  contestMapFetch: PromiseState<Map<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<Map<ContestId, Problem[]>>;
  submissionsFetch: PromiseState<Submission[]>;
  submissionsMapFetch: PromiseState<Map<ProblemId, Submission[]>>;
  problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  shortestRanking: PromiseState<RankingEntry[]>;
  fastestRanking: PromiseState<RankingEntry[]>;
  firstRanking: PromiseState<RankingEntry[]>;
}

const InnerAchievementBlock: React.FC<InnerProps> = (props) => {
  const contestMap = props.contestMapFetch.fulfilled
    ? props.contestMapFetch.value
    : new Map<ContestId, Contest>();
  const contestToProblems = props.contestToProblemsFetch.fulfilled
    ? props.contestToProblemsFetch.value
    : new Map<ContestId, Problem[]>();
  const userSubmissions = props.submissionsFetch.fulfilled
    ? props.submissionsFetch.value
    : [];
  const submissionsMap = props.submissionsMapFetch.fulfilled
    ? props.submissionsMapFetch.value
    : new Map<ProblemId, Submission[]>();
  const problemModels = props.problemModelsFetch.fulfilled
    ? props.problemModelsFetch.value
    : new Map<ProblemId, ProblemModel>();

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
  const { data: acRanking } = useACRanking();
  const acRank = acRanking
    ? acRanking.filter((entry) => entry.problem_count > solvedCount).length
    : undefined;
  const shortRank = findFromRanking(shortRanking, props.userId);
  const firstRank = findFromRanking(firstRanking, props.userId);
  const fastRank = findFromRanking(fastRanking, props.userId);

  const ratedProblemIds = new Set(
    Array.from(contestMap.values())
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
  const { data: sumRanking } = useSumRanking();
  const sumRank = sumRanking
    ? sumRanking.filter((entry) => entry.problem_count > ratedPointSum).length
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
  const { data: streakRanking } = useStreakRanking();
  const longestStreakRank = streakRanking
    ? streakRanking.filter((e) => e.problem_count > longestStreak).length
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

export const AchievementBlock = connect<OuterProps, InnerProps>(
  ({ userId }) => ({
    contestMapFetch: {
      comparison: null,
      value: CachedApiClient.cachedContestMap().then((map) =>
        ImmutableMigration.convertMap(map)
      ),
    },
    contestToProblemsFetch: {
      value: CachedApiClient.cachedContestToProblemMap().then((map) =>
        ImmutableMigration.convertMapOfLists(map)
      ),
    },
    submissionsFetch: {
      comparison: userId,
      value: CachedApiClient.cachedSubmissions(userId).then((list) =>
        list.toArray()
      ),
    },
    submissionsMapFetch: {
      comparison: userId,
      value: CachedApiClient.cachedUsersSubmissionMap(
        List([userId])
      ).then((map) => ImmutableMigration.convertMapOfLists(map)),
    },
    problemModelsFetch: {
      value: CachedApiClient.cachedProblemModels().then((map) =>
        ImmutableMigration.convertMap(map)
      ),
    },
    shortestRanking: {
      value: CachedApiClient.cachedShortRanking().then((list) =>
        list.toArray()
      ),
    },
    fastestRanking: {
      value: CachedApiClient.cachedFastRanking().then((list) => list.toArray()),
    },
    firstRanking: {
      value: CachedApiClient.cachedFirstRanking().then((list) =>
        list.toArray()
      ),
    },
  })
)(InnerAchievementBlock);
