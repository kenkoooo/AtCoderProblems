import React from "react";
import { Row, Col } from "reactstrap";

import Submission from "../../interfaces/Submission";
import UserInfo from "../../interfaces/UserInfo";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import { ordinalSuffixOf, isAccepted } from "../../utils";
import { formatDate } from "../../utils/DateFormat";

import ClimbingLineChart from "./ClimbingLineChart";
import DailyEffortBarChart from "./DailyEffortBarChart";
import SmallPieChart from "./SmallPieChart";
import FilteringHeatmap from "./FilteringHeatmap";
import SubmissionList from "./SubmissionList";
import LanguageCount from "./LanguageCount";
import Recommendations from "./Recommendations";
import State from "../../interfaces/State";
import { Dispatch } from "redux";
import {
  requestContestProblemPair,
  requestContests,
  requestMergedProblems,
  requestPerf
} from "../../actions";
import { List, Map, Set } from "immutable";
import { connect } from "react-redux";
import {
  getFastRanking,
  getFirstRanking,
  getShortRanking
} from "../../utils/Api";

const ONE_DAY_MILLI_SECONDS = 24 * 3600 * 1000;

interface Props {
  userId: string;
  userInfo: UserInfo | undefined;
  contests: Map<string, Contest>;
  mergedProblems: Map<string, MergedProblem>;
  contestToProblems: Map<string, List<string>>;
  submissions: Map<string, List<Submission>>;
  problemPerformances: Map<string, number>;

  requestMergedProblems: () => void;
  requestContests: () => void;
  requestContestProblemPairs: () => void;
  requestPerf: () => void;
}

const solvedCountForPieChart = (
  problemIds: List<string>,
  submissions: Map<string, List<Submission>>,
  userId: string
) => {
  const userCount = problemIds
    .map(id => submissions.get(id, List<Submission>()))
    .flatMap(list => list)
    .filter(s => s.user_id === userId)
    .filter(s => isAccepted(s.result))
    .reduce((set, s) => set.add(s.problem_id), Set<string>())
    .map(problemId => problemId.substring(7, 8))
    .reduce(
      (map, fragment) => map.update(fragment, 0, count => count + 1),
      Map<string, number>()
    );
  const totalCount = problemIds
    .map(id => id.substring(7, 8))
    .reduce(
      (map, fragment) => map.update(fragment, 0, count => count + 1),
      Map<string, number>()
    );
  return List([
    ["a", "1"],
    ["b", "2"],
    ["c", "3"],
    ["d", "4"],
    ["e", "5"],
    ["f", "6"]
  ])
    .map(([label1, label2]) => ({
      solved: userCount.get(label1, 0) + userCount.get(label2, 0),
      total: totalCount.get(label1, 0) + totalCount.get(label2, 0)
    }))
    .filter(x => x.total > 0);
};

const findFromRanking = (
  ranking: { user_id: string; problem_count: number }[],
  userId: string
) => {
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

class UserPage extends React.Component<Props> {
  componentDidMount() {
    this.props.requestContests();
    this.props.requestMergedProblems();
    this.props.requestContestProblemPairs();
    this.props.requestPerf();
  }

  render() {
    const {
      userId,
      userInfo,
      submissions,
      mergedProblems,
      contestToProblems,
      contests,
      problemPerformances
    } = this.props;
    if (
      userId.length === 0 ||
      submissions.isEmpty() ||
      userInfo === undefined
    ) {
      return null;
    }

    const shortRanking = getShortRanking(mergedProblems.valueSeq().toList());
    const fastRanking = getFastRanking(mergedProblems.valueSeq().toList());
    const firstRanking = getFirstRanking(mergedProblems.valueSeq().toList());

    const shortRank = findFromRanking(shortRanking, userId);
    const firstRank = findFromRanking(firstRanking, userId);
    const fastRank = findFromRanking(fastRanking, userId);

    const userSubmissions = submissions
      .valueSeq()
      .flatMap(list => list)
      .filter(s => s.user_id === userId);

    const minAcceptedTimes = submissions
      .map(list =>
        list
          .filter(s => s.user_id === userId && isAccepted(s.result))
          .minBy(s => s.epoch_second)
      )
      .filter((s: Submission | undefined): s is Submission => s !== undefined);

    const dailyCount = minAcceptedTimes
      .map(s => formatDate(s.epoch_second))
      .reduce(
        (map, date) => map.update(date, 0, count => count + 1),
        Map<string, number>()
      )
      .entrySeq()
      .map(([date, count]) => ({
        date: new Date(date).getTime(),
        count
      }))
      .sort((a, b) => a.date - b.date);

    const climbing = dailyCount.reduce((list, e) => {
      const last = list.last(undefined);
      return last
        ? list.push({ ...e, count: last.count + e.count })
        : list.push(e);
    }, List<{ date: number; count: number }>());

    const { longestStreak, currentStreak, prevMilliSecond } = dailyCount
      .map(e => e.date)
      .reduce(
        (state, milliSecond) => {
          const currentStreak =
            milliSecond === state.prevMilliSecond + ONE_DAY_MILLI_SECONDS
              ? state.currentStreak + 1
              : 1;
          const longestStreak = Math.max(state.longestStreak, currentStreak);
          return { longestStreak, currentStreak, prevMilliSecond: milliSecond };
        },
        {
          longestStreak: 0,
          currentStreak: 0,
          prevMilliSecond: 0
        }
      );

    const isIncreasing =
      formatDate(new Date().getTime() - ONE_DAY_MILLI_SECONDS) ===
        formatDate(prevMilliSecond) ||
      formatDate(new Date().getTime()) === formatDate(prevMilliSecond);

    const abcSolved = solvedCountForPieChart(
      contestToProblems
        .filter((value, key) => key.substring(0, 3) === "abc")
        .valueSeq()
        .flatMap(list => list)
        .toList(),
      submissions,
      userId
    );
    const arcSolved = solvedCountForPieChart(
      contestToProblems
        .filter((value, key) => key.substring(0, 3) === "arc")
        .valueSeq()
        .flatMap(list => list)
        .toList(),
      submissions,
      userId
    );
    const agcSolved = solvedCountForPieChart(
      contestToProblems
        .filter((value, key) => key.substring(0, 3) === "agc")
        .valueSeq()
        .flatMap(list => list)
        .toList(),
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
            <h6 className="text-muted">{`Last AC: ${formatDate(
              prevMilliSecond
            )}`}</h6>
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
        <PieCharts
          problems={agcSolved.toArray()}
          title="AtCoder Grand Contest"
        />

        <Row className="my-2 border-bottom">
          <h1>Daily Effort</h1>
        </Row>
        <DailyEffortBarChart daily_data={dailyCount.toArray()} />

        <Row className="my-2 border-bottom">
          <h1>Climbing</h1>
        </Row>
        <ClimbingLineChart climbing_data={climbing.toArray()} />

        <Row className="my-2 border-bottom">
          <h1>Heatmap</h1>
        </Row>
        <FilteringHeatmap submissions={userSubmissions.toArray()} />

        <Row className="my-2 border-bottom">
          <h1>Submissions</h1>
        </Row>
        <SubmissionList
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
          submissions={userSubmissions.toArray()}
          problems={mergedProblems.valueSeq().toArray()}
          contests={contests.valueSeq().toArray()}
          performances={problemPerformances
            .entrySeq()
            .map(([problem_id, minimum_performance]) => ({
              problem_id,
              minimum_performance
            }))
            .toArray()}
        />
      </div>
    );
  }
}

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

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  contests: state.contests,
  mergedProblems: state.mergedProblems,
  contestToProblems: state.contestToProblems,
  submissions: state.submissions,
  problemPerformances: state.problemPerformances,
  userInfo: state.userInfo
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestContests: () => dispatch(requestContests()),
  requestContestProblemPairs: () => dispatch(requestContestProblemPair()),
  requestMergedProblems: () => dispatch(requestMergedProblems()),
  requestPerf: () => dispatch(requestPerf())
});

export default connect(
  stateToProps,
  dispatchToProps
)(UserPage);
