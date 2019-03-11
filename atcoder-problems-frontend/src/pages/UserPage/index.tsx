import React from 'react';
import { Row, Col } from 'reactstrap';
import {
	BarChart,
	Bar,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	LineChart,
	Line,
	ResponsiveContainer
} from 'recharts';

import * as Api from '../../utils/Api';
import Submission from '../../interfaces/Submission';
import UserInfo from '../../interfaces/UserInfo';
import MergedProblem from '../../interfaces/MergedProblem';
import { ordinalSuffixOf, isAccepted } from '../../utils';
import { formatDate } from '../../utils/DateFormat';

import ClimingLineChart from './ClimingLineChart';
import DailyEffortBarChart from './DailyEffortBarChart';
import SmallPieChart from './SmallPieChart';
import FilteringHeatmap from './FilteringHeatmap';
import SubmissionList from './SubmissionList';

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
	user_info: UserInfo;

	current_streak: number;
	longest_streak: number;
	last_ac: string;

	daily_data: { date: number; count: number }[];
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
			user_info: {
				accepted_count: 1e9 + 7,
				accepted_count_rank: 1e9 + 7,
				rated_point_sum: 1e9 + 7,
				rated_point_sum_rank: 1e9 + 7,
				user_id: ''
			},

			current_streak: 1e9 + 7,
			longest_streak: 1e9 + 7,
			last_ac: '',

			daily_data: []
		};
	}

	componentDidMount() {
		Api.fetchFirstRanking()
			.then((ranking) => ranking.sort((a, b) => b.problem_count - a.problem_count))
			.then((first_ranking) => this.setState({ first_ranking }));
		Api.fetchShortRanking()
			.then((ranking) => ranking.sort((a, b) => b.problem_count - a.problem_count))
			.then((short_ranking) => this.setState({ short_ranking }));
		Api.fetchFastRanking()
			.then((ranking) => ranking.sort((a, b) => b.problem_count - a.problem_count))
			.then((fast_ranking) => this.setState({ fast_ranking }));
		Api.fetchMergedProblems().then((problems) => this.setState({ problems }));
		this.updateState(this.getUserIdFromProps());
	}
	componentDidUpdate(prevProps: Props) {
		if (this.props !== prevProps) {
			this.updateState(this.getUserIdFromProps());
		}
	}

	updateState(user_id: string) {
		Api.fetchSubmissions(user_id).then((submissions) => {
			const first_ac_map = submissions
				.filter((s) => isAccepted(s.result))
				.sort((a, b) => b.epoch_second - a.epoch_second)
				.reduce((map, s) => map.set(s.problem_id, s.epoch_second), new Map<string, number>());
			const { longest_streak, current_streak, last_ac } = get_streak(first_ac_map);
			const date_count_map = Array.from(first_ac_map).reduce((map, [ problem_id, second ]) => {
				const date = formatDate(second);
				const count = map.get(date);
				if (count) {
					return map.set(date, count + 1);
				} else {
					return map.set(date, 1);
				}
			}, new Map<string, number>());
			const daily_data = Array.from(date_count_map)
				.map(([ date, count ]) => ({ date: new Date(date).getTime(), count }))
				.sort((a, b) => a.date - b.date);
			this.setState({
				submissions,
				longest_streak,
				current_streak,
				last_ac,
				daily_data
			});
		});
		Api.fetchUserInfo(user_id).then((user_info) => this.setState({ user_info }));
	}

	getUserIdFromProps() {
		return this.props.user_ids.length > 0 ? this.props.user_ids[0] : '';
	}

	render() {
		const user_id = this.getUserIdFromProps();
		if (user_id.length == 0) {
			return <div />;
		}

		const { submissions, user_info, longest_streak, current_streak, last_ac, problems } = this.state;

		const shortest_rank = get_rank(user_id, this.state.short_ranking);
		const fastest_rank = get_rank(user_id, this.state.fast_ranking);
		const first_rank = get_rank(user_id, this.state.first_ranking);

		const climing_data = this.state.daily_data.map((d) => Object.assign({}, d));
		climing_data.forEach((_, i) => {
			if (i > 0) {
				climing_data[i].count += climing_data[i - 1].count;
			}
		});

		const ac_submissions = submissions.filter((s) => s.user_id === user_id && isAccepted(s.result));

		const agc_solved = count_solved(/^agc\d{3}_/, problems, ac_submissions);
		const abc_solved = count_solved(/^abc\d{3}_/, problems, ac_submissions);
		const arc_solved = count_solved(/^arc\d{3}_/, problems, ac_submissions);

		const achievements = [
			{
				key: 'Accepted',
				value: user_info.accepted_count,
				rank: user_info.accepted_count_rank
			},
			{
				key: 'Shortest Code',
				value: shortest_rank.count,
				rank: shortest_rank.rank
			},
			{
				key: 'Fastest Code',
				value: fastest_rank.count,
				rank: fastest_rank.rank
			},
			{ key: 'First AC', value: first_rank.count, rank: first_rank.rank }
		];

		return (
			<div>
				<Row className="my-2 border-bottom">
					<h1>{user_id}</h1>
				</Row>
				<Row className="my-3">
					{achievements.map(({ key, value, rank }) => (
						<Col key={key} className="text-center">
							<h6>{key}</h6>
							<h3>{value}</h3>
							<h6 className="text-muted">{`${rank + 1}${ordinalSuffixOf(rank + 1)}`}</h6>
						</Col>
					))}
				</Row>
				<Row className="my-3">
					<Col key="Rated Point Sum" className="text-center">
						<h6>Rated Point Sum</h6>
						<h3>{this.state.user_info.rated_point_sum} pt</h3>
						<h6 className="text-muted">{`${this.state.user_info.rated_point_sum_rank + 1}${ordinalSuffixOf(
							this.state.user_info.rated_point_sum + 1
						)}`}</h6>
					</Col>
					<Col key="Longest Streak" className="text-center">
						<h6>Longest Streak</h6>
						<h3>{longest_streak} days</h3>
					</Col>
					<Col key="Current Streak" className="text-center">
						<h6>Current Streak</h6>
						<h3>{current_streak} days</h3>
						<h6 className="text-muted">{`Last AC: ${last_ac}`}</h6>
					</Col>
					<Col />
				</Row>

				<Row className="my-2 border-bottom">
					<h1>AtCoder Beginner Contest</h1>
				</Row>
				<Row className="my-3">
					{abc_solved.map(({ solved, total }, i) => {
						const key = 'ABCDEF'.split('')[i];
						return (
							<Col key={key} className="text-center" xs="3">
								<SmallPieChart accepted={solved} trying={total - solved} title={`Problem ${key}`} />
							</Col>
						);
					})}
				</Row>

				<Row className="my-2 border-bottom">
					<h1>AtCoder Regular Contest</h1>
				</Row>
				<Row className="my-3">
					{arc_solved.map(({ solved, total }, i) => {
						const key = 'ABCDEF'.split('')[i];
						return (
							<Col key={key} className="text-center" xs="3">
								<SmallPieChart accepted={solved} trying={total - solved} title={`Problem ${key}`} />
							</Col>
						);
					})}
				</Row>

				<Row className="my-2 border-bottom">
					<h1>AtCoder Grand Contest</h1>
				</Row>
				<Row className="my-3">
					{agc_solved.map(({ solved, total }, i) => {
						const key = 'ABCDEF'.split('')[i];
						return (
							<Col key={key} className="text-center" xs="2">
								<SmallPieChart accepted={solved} trying={total - solved} title={`Problem ${key}`} />
							</Col>
						);
					})}
				</Row>

				<Row className="my-2 border-bottom">
					<h1>Daily Effort</h1>
				</Row>
				<DailyEffortBarChart daily_data={this.state.daily_data} />

				<Row className="my-2 border-bottom">
					<h1>Climing</h1>
				</Row>
				<ClimingLineChart climing_data={climing_data} />

				<Row className="my-2 border-bottom">
					<h1>Heatmap</h1>
				</Row>
				<FilteringHeatmap submissions={submissions.filter((s) => s.user_id === user_id)} />

				<Row className="my-2 border-bottom">
					<h1>Submissions</h1>
				</Row>
				<SubmissionList problems={problems} submissions={submissions.filter((s) => s.user_id === user_id)} />
			</div>
		);
	}
}

const get_streak = (first_ac_map: Map<string, number>) => {
	let longest_streak = 1;
	let current_streak = 1;
	const seconds = Array.from(first_ac_map).map(([ problem_id, epoch_second ]) => epoch_second).sort();
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
	const rank = ranking.filter((rank) => rank.user_id == user_id)[0];
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

const count_solved = (prefix: RegExp, problems: MergedProblem[], ac_submissions: Submission[]) => {
	const regexps = [ /_[a1]/, /_[b2]/, /_[c3]/, /_[d4]/, /_[e5]/, /_[f6]/ ];
	const count = (ids: string[]) => {
		const c = [ 0, 0, 0, 0, 0, 0 ];
		ids.filter((id) => id.match(prefix)).forEach((id) => {
			regexps.forEach((e, i) => {
				if (id.match(e)) {
					c[i] += 1;
				}
			});
		});
		return c;
	};

	const total_count = count(problems.map((p) => p.id));
	const solved_count = count(Array.from(ac_submissions.reduce((set, s) => set.add(s.problem_id), new Set<string>())));

	return total_count
		.map((total, i) => ({
			total: total,
			solved: solved_count[i]
		}))
		.filter(({ total }) => total > 0);
};

export default UserPage;
