import React from "react";
import { Col, Row } from "reactstrap";
import { ordinalSuffixOf } from "../../../utils";
import UserInfo from "../../../interfaces/UserInfo";
import {
  formatMomentDate,
  getToday,
  parseDateLabel
} from "../../../utils/DateUtil";
import { connect, PromiseState } from "react-refetch";
import { RankingEntry } from "../../../interfaces/RankingEntry";
import {
  cachedFastRanking,
  cachedFirstRanking,
  cachedShortRanking
} from "../../../utils/CachedApiClient";
import * as Api from "../../../utils/Api";

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
  dailyCount: { dateLabel: string; count: number }[];
}

interface InnerProps extends OuterProps {
  shortestRanking: PromiseState<RankingEntry[]>;
  fastestRanking: PromiseState<RankingEntry[]>;
  firstRanking: PromiseState<RankingEntry[]>;
  userInfo: PromiseState<UserInfo | undefined>;
}

const InnerAchievementBlock = (props: InnerProps) => {
  const userInfo = props.userInfo.fulfilled ? props.userInfo.value : undefined;
  const { longestStreak, currentStreak, prevDateLabel } = props.dailyCount
    .map(e => e.dateLabel)
    .reduce(
      (state, dateLabel) => {
        const nextDateLabel = formatMomentDate(
          parseDateLabel(state.prevDateLabel).add(1, "day")
        );
        // tslint:disable-next-line
        const currentStreak =
          dateLabel === nextDateLabel ? state.currentStreak + 1 : 1;
        // tslint:disable-next-line
        const longestStreak = Math.max(state.longestStreak, currentStreak);
        return { longestStreak, currentStreak, prevDateLabel: dateLabel };
      },
      {
        longestStreak: 0,
        currentStreak: 0,
        prevDateLabel: ""
      }
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

  const shortRank = findFromRanking(shortRanking, props.userId);
  const firstRank = findFromRanking(firstRanking, props.userId);
  const fastRank = findFromRanking(fastRanking, props.userId);
  const achievements = [
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
    }
  ];
  if (userInfo) {
    achievements.splice(0, 0, {
      key: "Accepted",
      value: userInfo.accepted_count,
      rank: userInfo.accepted_count_rank
    });
  }

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
            <h6 className="text-muted">{`${rank + 1}${ordinalSuffixOf(
              rank + 1
            )}`}</h6>
          </Col>
        ))}
        {userInfo ? (
          <Col key="Rated Point Sum" className="text-center" xs="6" md="3">
            <h6>Rated Point Sum</h6>
            <h3>{userInfo.rated_point_sum} pt</h3>
            <h6 className="text-muted">{`${userInfo.rated_point_sum_rank +
              1}${ordinalSuffixOf(userInfo.rated_point_sum_rank + 1)}`}</h6>
          </Col>
        ) : null}
        <Col key="Longest Streak" className="text-center" xs="6" md="3">
          <h6>Longest Streak</h6>
          <h3>{longestStreak} days</h3>
        </Col>
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
  userInfo: {
    comparison: props.userId,
    value: () => Api.fetchUserInfo(props.userId)
  }
}))(InnerAchievementBlock);
