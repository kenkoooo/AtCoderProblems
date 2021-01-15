import React from "react";
import { Badge, Col, Row, UncontrolledTooltip } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { caseInsensitiveUserId, ordinalSuffixOf } from "../../../utils";
import { formatMomentDate, getToday } from "../../../utils/DateUtil";
import { RankingEntry } from "../../../interfaces/RankingEntry";
import {
  cachedACRanking,
  cachedFastRanking,
  cachedFirstRanking,
  cachedShortRanking,
  cachedStreaksRanking,
  cachedSumRanking,
} from "../../../utils/CachedApiClient";

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
  solvedCount: number;
  ratedPointSum: number;
  longestStreak: number;
  currentStreak: number;
  prevDateLabel: string;
  streakSum: number;
}

interface InnerProps extends OuterProps {
  shortestRanking: PromiseState<RankingEntry[]>;
  fastestRanking: PromiseState<RankingEntry[]>;
  firstRanking: PromiseState<RankingEntry[]>;
  acRank: PromiseState<number>;
  sumRank: PromiseState<number>;
  streakRank: PromiseState<number>;
}

const InnerAchievementBlock: React.FC<InnerProps> = (props) => {
  const { longestStreak, currentStreak, prevDateLabel, streakSum } = props;
  const shortRanking = props.shortestRanking.fulfilled
    ? props.shortestRanking.value
    : ([] as RankingEntry[]);
  const fastRanking = props.fastestRanking.fulfilled
    ? props.fastestRanking.value
    : ([] as RankingEntry[]);
  const firstRanking = props.firstRanking.fulfilled
    ? props.firstRanking.value
    : ([] as RankingEntry[]);

  const shortRank = findFromRanking(shortRanking, props.userId);
  const firstRank = findFromRanking(firstRanking, props.userId);
  const fastRank = findFromRanking(fastRanking, props.userId);
  const achievements = [
    {
      key: "Accepted",
      value: props.solvedCount,
      rank: props.acRank.fulfilled ? props.acRank.value : undefined,
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
      value: props.ratedPointSum,
      rank: props.sumRank.fulfilled ? props.sumRank.value : undefined,
    },
  ];

  const yesterdayLabel = formatMomentDate(getToday().add(-1, "day"));
  const isIncreasing = prevDateLabel >= yesterdayLabel;
  const longestStreakRank = props.streakRank.fulfilled
    ? props.streakRank.value
    : undefined;
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
        <Col />
      </Row>
    </>
  );
};

export const AchievementBlock = connect<OuterProps, InnerProps>((props) => ({
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
  acRank: {
    comparison: props.solvedCount,
    value: (): Promise<number> =>
      cachedACRanking().then(
        (ranking) =>
          ranking.filter((entry) => entry.problem_count > props.solvedCount)
            .length
      ),
  },
  sumRank: {
    comparison: props.ratedPointSum,
    value: (): Promise<number> =>
      cachedSumRanking().then(
        (ranking) =>
          ranking.filter((entry) => entry.problem_count > props.ratedPointSum)
            .length
      ),
  },
  streakRank: {
    comparison: props.longestStreak,
    value: (): Promise<number> =>
      cachedStreaksRanking().then(
        (r) => r.filter((e) => e.problem_count > props.longestStreak).length
      ),
  },
}))(InnerAchievementBlock);
