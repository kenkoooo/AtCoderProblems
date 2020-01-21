import React from "react";
import { Col, Row } from "reactstrap";

import Submission from "../../interfaces/Submission";
import UserInfo from "../../interfaces/UserInfo";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import { isAccepted, ordinalSuffixOf } from "../../utils";
import {
  formatMomentDate,
  getToday,
  parseDateLabel,
  parseSecond
} from "../../utils/DateUtil";
import ClimbingLineChart from "./ClimbingLineChart";
import DailyEffortBarChart from "./DailyEffortBarChart";
import SmallPieChart from "./SmallPieChart";
import FilteringHeatmap from "./FilteringHeatmap";
import SubmissionList from "./SubmissionList";
import LanguageCount from "./LanguageCount";
import Recommendations from "./Recommendations";
import { ContestId, ProblemId } from "../../interfaces/Status";
import { List, Map } from "immutable";
import * as Api from "../../utils/Api";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { RankingEntry } from "../../interfaces/RankingEntry";
import ProblemModel from "../../interfaces/ProblemModel";
import { RatingInfo, ratingInfoOf } from "../../utils/RatingInfo";
import Problem from "../../interfaces/Problem";
import { connect, PromiseState } from "react-refetch";
import { useParams } from "react-router-dom";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  userInfoFetch: PromiseState<UserInfo | undefined>;
  userRatingInfoFetch: PromiseState<RatingInfo>;
  mergedProblemsFetch: PromiseState<Map<ProblemId, MergedProblem>>;
  submissionsFetch: PromiseState<Map<ProblemId, List<Submission>>>;
  contestsFetch: PromiseState<Map<ContestId, Contest>>;
  contestToProblemsFetch: PromiseState<Map<ContestId, List<Problem>>>;
  problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  shortRankingFetch: PromiseState<List<RankingEntry>>;
  fastRankingFetch: PromiseState<List<RankingEntry>>;
  firstRankingFetch: PromiseState<List<RankingEntry>>;
}

const solvedCountForPieChart = (
  contestToProblems: Map<string, List<Problem>>,
  submissions: Map<string, List<Submission>>,
  userId: string
) => {
  const mapProblemPosition = (contestId: string, problemId: string) => {
    const contestPrefix = contestId.substring(0, 3);
    const problemPrefix = problemId.substring(0, 3);
    const shift = contestPrefix === "abc" && problemPrefix === "arc";
    switch (problemId.substring(7, 8)) {
      case "1":
      case "a": {
        return shift ? 2 : 0;
      }
      case "2":
      case "b": {
        return shift ? 3 : 1;
      }
      case "3":
      case "c": {
        return 2;
      }
      case "4":
      case "d": {
        return 3;
      }
      case "e": {
        return 4;
      }
      case "f": {
        return 5;
      }
      default: {
        // tslint:disable-next-line
        console.error(`Unsupported problemId: ${contestId}/${problemId}`);
        return 0;
      }
    }
  };

  const userCount = contestToProblems
    .map(problems =>
      problems.filter(
        problem =>
          submissions
            .get(problem.id, List<Submission>())
            .filter(s => s.user_id === userId)
            .filter(s => isAccepted(s.result))
            .count() > 0
      )
    )
    .map((problemIds, contestId) =>
      problemIds.map(problem => mapProblemPosition(contestId, problem.id))
    )
    .valueSeq()
    .flatMap(list => list)
    .reduce(
      (count, position) => count.update(position, value => value + 1),
      List.of(0, 0, 0, 0, 0, 0)
    );
  const totalCount = contestToProblems
    .map((problemIds, contestId) =>
      problemIds.map(problem => mapProblemPosition(contestId, problem.id))
    )
    .valueSeq()
    .flatMap(list => list)
    .reduce(
      (count, position) => count.update(position, value => value + 1),
      List.of(0, 0, 0, 0, 0, 0)
    );
  return totalCount
    .map((total, index) => ({
      total,
      solved: userCount.get(index, 0)
    }))
    .filter(x => x.total > 0);
};

const findFromRanking = (ranking: List<RankingEntry>, userId: string) => {
  const entry = ranking
    .sort((a, b) => b.problem_count - a.problem_count)
    .find(r => r.user_id === userId);
  if (entry) {
    const count = entry.problem_count;
    const rank = ranking.filter(e => e.problem_count > count).size;
    return { rank, count };
  } else {
    return { rank: ranking.size, count: 0 };
  }
};
const UserPage = (props: InnerProps) => {
  const {
    userId,
    userInfoFetch,
    userRatingInfoFetch,
    submissionsFetch,
    mergedProblemsFetch,
    contestToProblemsFetch,
    contestsFetch,
    problemModelsFetch,
    shortRankingFetch,
    firstRankingFetch,
    fastRankingFetch
  } = props;
  const userInfo = userInfoFetch.fulfilled ? userInfoFetch.value : undefined;
  const userRatingInfo = userRatingInfoFetch.fulfilled
    ? userRatingInfoFetch.value
    : ratingInfoOf(List());
  const mergedProblems = mergedProblemsFetch.fulfilled
    ? mergedProblemsFetch.value
    : Map<ProblemId, MergedProblem>();
  const contests = contestsFetch.fulfilled
    ? contestsFetch.value
    : Map<string, Contest>();
  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : Map<ProblemId, ProblemModel>();
  const submissions = submissionsFetch.fulfilled
    ? submissionsFetch.value
    : Map<ProblemId, List<Submission>>();
  const contestToProblems = contestToProblemsFetch.fulfilled
    ? contestToProblemsFetch.value
    : Map<ContestId, List<Problem>>();

  if (userId.length === 0 || submissions.isEmpty() || userInfo === undefined) {
    return null;
  }

  const shortRanking = shortRankingFetch.fulfilled
    ? shortRankingFetch.value
    : List<RankingEntry>();
  const fastRanking = fastRankingFetch.fulfilled
    ? fastRankingFetch.value
    : List<RankingEntry>();
  const firstRanking = firstRankingFetch.fulfilled
    ? firstRankingFetch.value
    : List<RankingEntry>();

  const shortRank = findFromRanking(shortRanking, userId);
  const firstRank = findFromRanking(firstRanking, userId);
  const fastRank = findFromRanking(fastRanking, userId);

  const userSubmissions = submissions
    .valueSeq()
    .flatMap(list => list)
    .filter(s => s.user_id === userId);

  const dailyCount = submissions
    .map(submissionList =>
      submissionList
        .filter(s => s.user_id === userId && isAccepted(s.result))
        .map(s => s.epoch_second)
        .min()
    )
    .filter(
      (second: number | undefined): second is number => second !== undefined
    )
    .map(second => formatMomentDate(parseSecond(second)))
    .reduce(
      (map, date) => map.update(date, 0, count => count + 1),
      Map<string, number>()
    )
    .entrySeq()
    .map(([dateLabel, count]) => ({ dateLabel, count }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));

  const climbing = dailyCount.reduce((list, { dateLabel, count }) => {
    const dateSecond = parseDateLabel(dateLabel).unix();
    const last = list.last(undefined);
    return last
      ? list.push({ dateSecond, count: last.count + count })
      : list.push({ dateSecond, count });
  }, List<{ dateSecond: number; count: number }>());

  const { longestStreak, currentStreak, prevDateLabel } = dailyCount
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

  const yesterdayLabel = formatMomentDate(getToday().add(-1, "day"));
  const isIncreasing = prevDateLabel >= yesterdayLabel;

  const abcSolved = solvedCountForPieChart(
    contestToProblems.filter((value, key) => key.substring(0, 3) === "abc"),
    submissions,
    userId
  );
  const arcSolved = solvedCountForPieChart(
    contestToProblems.filter((value, key) => key.substring(0, 3) === "arc"),

    submissions,
    userId
  );
  const agcSolved = solvedCountForPieChart(
    contestToProblems.filter((value, key) => key.substring(0, 3) === "agc"),
    submissions,
    userId
  );

  const achievements = [
    {
      key: "Accepted",
      value: userInfo.accepted_count,
      rank: userInfo.accepted_count_rank
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
    }
  ];

  return (
    <div>
      <Row className="my-2 border-bottom">
        <h1>{userId}</h1>
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
        <Col key="Rated Point Sum" className="text-center" xs="6" md="3">
          <h6>Rated Point Sum</h6>
          <h3>{userInfo.rated_point_sum} pt</h3>
          <h6 className="text-muted">{`${userInfo.rated_point_sum_rank +
            1}${ordinalSuffixOf(userInfo.rated_point_sum_rank + 1)}`}</h6>
        </Col>
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

      <PieCharts
        problems={abcSolved.toArray()}
        title="AtCoder Beginner Contest"
      />
      <PieCharts
        problems={arcSolved.toArray()}
        title="AtCoder Regular Contest"
      />
      <PieCharts problems={agcSolved.toArray()} title="AtCoder Grand Contest" />

      <Row className="my-2 border-bottom">
        <h1>Daily Effort</h1>
      </Row>
      <DailyEffortBarChart
        dailyData={dailyCount
          .map(({ dateLabel, count }) => ({
            dateSecond: parseDateLabel(dateLabel).unix(),
            count
          }))
          .toArray()}
      />

      <Row className="my-2 border-bottom">
        <h1>Climbing</h1>
      </Row>
      <ClimbingLineChart climbingData={climbing.toArray()} />

      <Row className="my-2 border-bottom">
        <h1>Heatmap</h1>
      </Row>
      <FilteringHeatmap submissions={userSubmissions.toArray()} />

      <Row className="my-2 border-bottom">
        <h1>Submissions</h1>
      </Row>
      <SubmissionList
        problemModels={problemModels}
        problems={mergedProblems.valueSeq().toArray()}
        submissions={userSubmissions.toArray()}
      />

      <Row className="my-2 border-bottom">
        <h1>Languages</h1>
      </Row>
      <LanguageCount submissions={userSubmissions.toArray()} />

      <Row className="my-2 border-bottom">
        <h1>Recommendations</h1>
      </Row>
      <Recommendations
        userSubmissions={userSubmissions.toList()}
        problems={mergedProblems.valueSeq().toList()}
        contests={contests}
        problemModels={problemModels}
        userRatingInfo={userRatingInfo}
      />
    </div>
  );
};

const PieCharts = ({
  problems,
  title
}: {
  problems: { total: number; solved: number }[];
  title: string;
}) => (
  <div>
    <Row className="my-2 border-bottom">
      <h1>{title}</h1>
    </Row>
    <Row className="my-3">
      {problems.map(({ solved, total }, i) => {
        const key = "ABCDEF".charAt(i);
        return (
          <Col
            key={key}
            className="text-center"
            xs="6"
            md={12 / problems.length}
          >
            <SmallPieChart
              accepted={solved}
              trying={total - solved}
              title={`Problem ${key}`}
            />
          </Col>
        );
      })}
    </Row>
  </div>
);

const InnerUserPage = connect<OuterProps, InnerProps>(props => ({
  submissionsFetch: {
    comparison: props.userId,
    value: () => CachedApiClient.cachedUsersSubmissionMap(List([props.userId]))
  },
  mergedProblemsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedMergedProblemMap()
  },
  problemModelsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemModels()
  },
  contestsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedContestMap()
  },
  userRatingInfoFetch: {
    comparison: props.userId,
    value: () => CachedApiClient.cachedRatingInfo(props.userId)
  },
  userInfoFetch: {
    comparison: props.userId,
    value: () => Api.fetchUserInfo(props.userId)
  },
  contestToProblemsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedContestToProblemMap()
  },
  shortRankingFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedShortRanking()
  },
  fastRankingFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedFastRanking()
  },
  firstRankingFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedFirstRanking()
  }
}))(UserPage);

export default () => {
  const { userIds } = useParams();
  const userId: string = (userIds ?? "").split("/")[0];
  return <InnerUserPage userId={userId} />;
};
