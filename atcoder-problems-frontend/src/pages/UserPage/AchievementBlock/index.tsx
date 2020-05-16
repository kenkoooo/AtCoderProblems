import React from "react";
import { Col, Row } from "reactstrap";
import { ordinalSuffixOf } from "../../../utils";
import { formatMomentDate, getToday } from "../../../utils/DateUtil";
import { connect, PromiseState } from "react-refetch";
import { RankingEntry } from "../../../interfaces/RankingEntry";
import {
  cachedACRanking,
  cachedFastRanking,
  cachedFirstRanking,
  cachedShortRanking,
  cachedStreaksRanking,
  cachedSumRanking
} from "../../../utils/CachedApiClient";

const findFromRanking = (ranking: RankingEntry[], userId: string) => {
  const entry = ranking
    .sort((a, b) => b.problem_count - a.problem_count)
    .find(r => r.user_id === userId);
  if (entry) {
    const count = entry.problem_count;
    const rank = ranking.filter(e => e.problem_count > count).length;
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
}

interface InnerProps extends OuterProps {
  shortestRanking: PromiseState<RankingEntry[]>;
  fastestRanking: PromiseState<RankingEntry[]>;
  firstRanking: PromiseState<RankingEntry[]>;
  acRank: PromiseState<number>;
  sumRank: PromiseState<number>;
  streakRank: PromiseState<number>;
}

const InnerAchievementBlock: React.FC<InnerProps> = props => {
  const { longestStreak, currentStreak, prevDateLabel } = props;
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
      rank: props.acRank.fulfilled ? props.acRank.value : undefined
    },
    {
      key: "Shortest Code",
      value: shortRank.count,
      rank: shortRank.rank
    },
    {
      key: "Fastest Code",
      value: fastRank.count,
      rank: fastRank.rank
    },
    {
      key: "First AC",
      value: firstRank.count,
      rank: firstRank.rank
    },
    {
      key: "Rated Point Sum",
      value: props.ratedPointSum,
      rank: props.sumRank.fulfilled ? props.sumRank.value : undefined
    },
    {
      key: "Longest Streak",
      value: `${longestStreak} days`,
      rank: props.streakRank.fulfilled ? props.streakRank.value : undefined
    }
  ];

  const yesterdayLabel = formatMomentDate(getToday().add(-1, "day"));
  const isIncreasing = prevDateLabel >= yesterdayLabel;
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
        <Col key="Current Streak" className="text-center" xs="6" md="3">
          <h6>Current Streak</h6>
          <h3>{isIncreasing ? currentStreak : 0} days</h3>
          <h6 className="text-muted">{`Last AC: ${prevDateLabel}`}</h6>
        </Col>
        <Col />
      </Row>
    </>
  );
};

export const AchievementBlock = connect<OuterProps, InnerProps>(props => ({
  shortestRanking: {
    comparison: null,
    value: () => cachedShortRanking().then(list => list.toArray())
  },
  fastestRanking: {
    comparison: null,
    value: () => cachedFastRanking().then(list => list.toArray())
  },
  firstRanking: {
    comparison: null,
    value: () => cachedFirstRanking().then(list => list.toArray())
  },
  acRank: {
    comparison: props.solvedCount,
    value: () =>
      cachedACRanking().then(
        ranking =>
          ranking.filter(entry => entry.problem_count > props.solvedCount)
            .length
      )
  },
  sumRank: {
    comparison: props.ratedPointSum,
    value: () =>
      cachedSumRanking().then(
        ranking =>
          ranking.filter(entry => entry.problem_count > props.ratedPointSum)
            .length
      )
  },
  streakRank: {
    comparison: props.longestStreak,
    value: () =>
      cachedStreaksRanking().then(
        r => r.filter(e => e.problem_count > props.longestStreak).length
      )
  }
}))(InnerAchievementBlock);
