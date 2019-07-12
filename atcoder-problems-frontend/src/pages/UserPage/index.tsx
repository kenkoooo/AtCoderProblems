import React from "react";
import { Row, Col } from "reactstrap";

import * as Api from "../../utils/Api";
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

interface Props {
  user_ids: string[];
}

interface RankingEntry {
  problem_count: number;
  user_id: string;
}

interface State {
  first_ranking: RankingEntry[];
  fast_ranking: RankingEntry[];
  short_ranking: RankingEntry[];

  problems: MergedProblem[];
  submissions: Submission[];
  user_info?: UserInfo;
  contests: Contest[];

  problem_performances: { problem_id: string; minimum_performance: number }[];

  current_streak: number;
  longest_streak: number;
  last_ac: string;

  daily_data: { date: number; count: number }[];
  edges: { contest_id: string; problem_id: string }[];
}

class UserPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      first_ranking: [],
      fast_ranking: [],
      short_ranking: [],

      problems: [],
      submissions: [],
      contests: [],

      problem_performances: [],

      current_streak: 1e9 + 7,
      longest_streak: 1e9 + 7,
      last_ac: "",

      daily_data: [],
      edges: []
    };
  }

  componentDidMount() {
    Promise.all([
      Api.fetchMergedProblems(),
      Api.fetchContestProblemPairs(),
      Api.fetchProblemPerformances(),
      Api.fetchContests()
    ]).then(([problems, edges, problem_performances, contests]) => {
      const fast_ranking = Api.getFastRanking(problems).sort(
        (a, b) => b.problem_count - a.problem_count
      );
      const short_ranking = Api.getShortRanking(problems).sort(
        (a, b) => b.problem_count - a.problem_count
      );
      const first_ranking = Api.getFirstRanking(problems).sort(
        (a, b) => b.problem_count - a.problem_count
      );
      this.setState({
        fast_ranking,
        first_ranking,
        short_ranking,
        problems,
        edges,
        problem_performances,
        contests
      });
    });
    this.updateState(this.getUserIdFromProps());
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props !== prevProps) {
      this.updateState(this.getUserIdFromProps());
    }
  }

  updateState(user_id: string) {
    Api.fetchSubmissions(user_id).then(submissions => {
      const first_ac_map = submissions
        .filter(s => isAccepted(s.result))
        .sort((a, b) => b.epoch_second - a.epoch_second)
        .reduce(
          (map, s) => map.set(s.problem_id, s.epoch_second),
          new Map<string, number>()
        );
      const { longest_streak, current_streak, last_ac } = get_streak(
        first_ac_map
      );
      const date_count_map = Array.from(first_ac_map).reduce(
        (map, [problem_id, second]) => {
          const date = formatDate(second);
          const count = map.get(date);
          if (count) {
            return map.set(date, count + 1);
          } else {
            return map.set(date, 1);
          }
        },
        new Map<string, number>()
      );
      const daily_data = Array.from(date_count_map)
        .map(([date, count]) => ({ date: new Date(date).getTime(), count }))
        .sort((a, b) => a.date - b.date);
      this.setState({
        submissions,
        longest_streak,
        current_streak,
        last_ac,
        daily_data
      });
    });
    Api.fetchUserInfo(user_id).then(user_info => this.setState({ user_info }));
  }

  getUserIdFromProps() {
    return this.props.user_ids.length > 0 ? this.props.user_ids[0] : "";
  }

  render() {
    const user_id = this.getUserIdFromProps();
    const {
      submissions,
      user_info,
      longest_streak,
      current_streak,
      last_ac,
      problems,
      edges,
      problem_performances,
      contests
    } = this.state;
    if (user_id.length == 0 || submissions.length == 0 || !user_info) {
      return null;
    }

    const shortest_rank = get_rank(user_id, this.state.short_ranking);
    const fastest_rank = get_rank(user_id, this.state.fast_ranking);
    const first_rank = get_rank(user_id, this.state.first_ranking);

    const climbing_data = this.state.daily_data.map(d => Object.assign({}, d));
    climbing_data.forEach((_, i) => {
      if (i > 0) {
        climbing_data[i].count += climbing_data[i - 1].count;
      }
    });

    const ac_submissions = submissions.filter(
      s => s.user_id === user_id && isAccepted(s.result)
    );

    const agc_solved = countSolved(/^agc\d{3}$/, edges, ac_submissions);
    const abc_solved = countSolved(/^abc\d{3}$/, edges, ac_submissions);
    const arc_solved = countSolved(/^arc\d{3}$/, edges, ac_submissions);

    const achievements = [
      {
        key: "Accepted",
        value: user_info.accepted_count,
        rank: user_info.accepted_count_rank
      },
      {
        key: "Shortest Code",
        value: shortest_rank.count,
        rank: shortest_rank.rank
      },
      {
        key: "Fastest Code",
        value: fastest_rank.count,
        rank: fastest_rank.rank
      },
      {
        key: "First AC",
        value: first_rank.count,
        rank: first_rank.rank
      }
    ];

    return (
      <div>
        <Row className="my-2 border-bottom">
          <h1>{user_id}</h1>
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
            <h3>{user_info.rated_point_sum} pt</h3>
            <h6 className="text-muted">{`${user_info.rated_point_sum_rank +
              1}${ordinalSuffixOf(user_info.rated_point_sum_rank + 1)}`}</h6>
          </Col>
          <Col key="Longest Streak" className="text-center" xs="6" md="3">
            <h6>Longest Streak</h6>
            <h3>{longest_streak} days</h3>
          </Col>
          <Col key="Current Streak" className="text-center" xs="6" md="3">
            <h6>Current Streak</h6>
            <h3>{current_streak} days</h3>
            <h6 className="text-muted">{`Last AC: ${last_ac}`}</h6>
          </Col>
          <Col />
        </Row>

        <PieCharts problems={abc_solved} title="AtCoder Beginner Contest" />
        <PieCharts problems={arc_solved} title="AtCoder Regular Contest" />
        <PieCharts problems={agc_solved} title="AtCoder Grand Contest" />

        <Row className="my-2 border-bottom">
          <h1>Daily Effort</h1>
        </Row>
        <DailyEffortBarChart daily_data={this.state.daily_data} />

        <Row className="my-2 border-bottom">
          <h1>Climbing</h1>
        </Row>
        <ClimbingLineChart climbing_data={climbing_data} />

        <Row className="my-2 border-bottom">
          <h1>Heatmap</h1>
        </Row>
        <FilteringHeatmap
          submissions={submissions.filter(s => s.user_id === user_id)}
        />

        <Row className="my-2 border-bottom">
          <h1>Submissions</h1>
        </Row>
        <SubmissionList
          problems={problems}
          submissions={submissions.filter(s => s.user_id === user_id)}
        />

        <Row className="my-2 border-bottom">
          <h1>Languages</h1>
        </Row>
        <LanguageCount
          submissions={submissions.filter(s => s.user_id === user_id)}
        />

        <Row className="my-2 border-bottom">
          <h1>Recommendations</h1>
        </Row>
        <Recommendations
          submissions={submissions}
          problems={problems}
          contests={contests}
          performances={problem_performances}
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

const get_streak = (first_ac_map: Map<string, number>) => {
  let longest_streak = 1;
  let current_streak = 1;
  const seconds = Array.from(first_ac_map)
    .map(([problem_id, epoch_second]) => epoch_second)
    .sort();
  for (let index = 1; index < seconds.length; index++) {
    const second1 = seconds[index - 1];
    const second2 = seconds[index];
    if (formatDate(second2) === formatDate(second1)) {
      continue;
    }
    if (formatDate(second2) === formatDate(second1 + 24 * 3600)) {
      current_streak += 1;
    } else {
      longest_streak = Math.max(longest_streak, current_streak);
      current_streak = 1;
    }
  }
  longest_streak = Math.max(longest_streak, current_streak);
  const today = new Date().getTime() / 1000;
  const last_ac_second = seconds[seconds.length - 1];

  if (
    formatDate(today) !== formatDate(last_ac_second) &&
    formatDate(today) !== formatDate(last_ac_second + 24 * 3600)
  ) {
    current_streak = 0;
  }
  return {
    longest_streak,
    current_streak,
    last_ac: formatDate(last_ac_second)
  };
};

const get_rank = (user_id: string, ranking: RankingEntry[]) => {
  const rank = ranking.filter(rank => rank.user_id == user_id)[0];
  if (!rank) {
    return { count: 0, rank: ranking.length };
  }
  const { problem_count } = rank;
  const index = ranking
    .map(({ problem_count }, i) => {
      return { count: problem_count, i };
    })
    .filter(({ count }) => count == problem_count)
    .reduce((min, { i }) => Math.min(i, min), ranking.length);
  return { count: ranking[index].problem_count, rank: index };
};

const countSolved = (
  contestRegexp: RegExp,
  edges: { contest_id: string; problem_id: string }[],
  acSubmissions: Submission[]
) => {
  const regexps = [/_[a1]/, /_[b2]/, /_[c3]/, /_[d4]/, /_[e5]/, /_[f6]/];
  const problemIdSet = new Set(
    edges.filter(e => e.contest_id.match(contestRegexp)).map(e => e.problem_id)
  );
  const acProblemIdSet = new Set(
    acSubmissions
      .filter(s => problemIdSet.has(s.problem_id))
      .map(s => s.problem_id)
  );

  const shiftedProblemIds = new Set(
    edges
      .filter(e => e.contest_id.match(contestRegexp))
      .filter(e => e.contest_id.substring(0, 6) != e.problem_id.substring(0, 6))
      .map(e => e.problem_id)
  );

  const count = regexps.map(_ => ({ total: 0, solved: 0 }));
  regexps.forEach((regexp, i) => {
    problemIdSet.forEach(id => {
      if (id.match(regexp)) {
        if (shiftedProblemIds.has(id)) {
          count[i + 2].total += 1;
        } else {
          count[i].total += 1;
        }
      }
    });
    acProblemIdSet.forEach(id => {
      if (id.match(regexp)) {
        if (shiftedProblemIds.has(id)) {
          count[i + 2].solved += 1;
        } else {
          count[i].solved += 1;
        }
      }
    });
  });
  return count.filter(c => c.total > 0);
};

export default UserPage;
