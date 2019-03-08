import React from 'react';
import { Row } from 'reactstrap';

const BootstrapTable = require('react-bootstrap-table-next').default;
const paginationFactory = require('react-bootstrap-table2-paginator').default;
const { PaginationProvider, PaginationListStandalone } = require('react-bootstrap-table2-paginator');

import * as Api from '../utils/Api';
import * as Url from '../utils/Url';
import MergedProblem from '../interfaces/MergedProblem';
import Contest from '../interfaces/Contest';
import Submission from '../interfaces/Submission';

const INF_POINT = 1e18;

interface Problem extends MergedProblem {
	showing_point: number;
	date: string;

	contest: Contest;

	status: string;
	rivals: string[];
}

interface Props {
	user_ids: string[];
}

interface State {
	problems: Problem[];
}

class ListPage extends React.Component<Props, State> {
	constructor(props: any) {
		super(props);
		this.state = {
			problems: []
		};
	}

	componentDidMount() {
		Promise.all([ Api.fetchMergedProblems(), Api.fetchContests() ]).then((result) => {
			const [ merged_problems, contests ] = result;
			const contest_map = contests.reduce(
				(map, contest) => map.set(contest.id, contest),
				new Map<string, Contest>()
			);

			const problems: Problem[] = merged_problems.map((problem) => {
				const showing_point = (() => {
					if (problem.point) {
						return problem.point;
					} else if (problem.predict) {
						return problem.predict;
					} else {
						return INF_POINT;
					}
				})();

				const contest = (() => {
					let contest = contest_map.get(problem.contest_id);
					if (contest) {
						return contest;
					} else {
						throw `${problem.id} is not belonged to any contest.`;
					}
				})();

				const date = new Date(contest.start_epoch_second * 1000).toLocaleDateString();

				const status = '';
				const rivals: string[] = [];

				return { status, showing_point, contest, date, rivals, ...problem };
			});

			problems.sort((a, b) => {
				if (a.contest.start_epoch_second == b.contest.start_epoch_second) {
					if (a.title < b.title) {
						return 1;
					} else if (a.title > b.title) {
						return -1;
					} else {
						return 0;
					}
				} else {
					return b.contest.start_epoch_second - a.contest.start_epoch_second;
				}
			});

			this.setState({ problems }, () => this.updateProblems(this.props.user_ids));
		});
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		if (prevProps.user_ids !== this.props.user_ids) {
			this.updateProblems(this.props.user_ids);
		}
	}

	updateProblems(user_ids: string[]) {
		return Promise.all(user_ids.map(Api.fetchSubmissions)).then((r) => r.flat()).then((submissions) => {
			const submission_map = submissions
				.sort((a, b) => a.epoch_second - b.epoch_second)
				.reduce((map, submission) => {
					const arr = map.get(submission.problem_id);
					if (arr) {
						arr.push(submission);
					} else {
						map.set(submission.problem_id, [ submission ]);
					}
					return map;
				}, new Map<string, Submission[]>());

			const user = user_ids.length > 0 ? user_ids[0] : '';
			const rivals = this.props.user_ids.slice(1);

			const problems = this.state.problems.map((problem) => {
				const submissions = (() => {
					const s = submission_map.get(problem.id);
					return s ? s : [];
				})();

				const new_status = (() => {
					const mine = submissions.filter((s) => s.user_id === user);
					if (mine.some((s) => s.result === 'AC')) {
						return 'AC';
					} else if (mine.length > 0) {
						return mine[mine.length - 1].result;
					} else {
						return '';
					}
				})();

				const new_rivals_set = (() =>
					submissions
						.filter((s) => rivals.includes(s.user_id))
						.filter((s) => s.result === 'AC')
						.reduce((set, submission) => set.add(submission.user_id), new Set<string>()))();
				const new_rivals = Array.from(new_rivals_set).sort();
				if (new_status !== problem.status || new_rivals !== problem.rivals) {
					const new_problem = Object.assign({}, problem);
					new_problem.rivals = new_rivals;
					new_problem.status = new_status;
					return new_problem;
				} else {
					return problem;
				}
			});

			this.setState({ problems });
		});
	}

	render() {
		const columns = [
			{
				dataField: 'date',
				text: 'Date',
				sort: true
			},
			{
				dataField: 'title',
				text: 'Problem',
				formatter: (_: string, row: Problem) => (
					<a href={Url.formatProblemUrl(row.id, row.contest_id)} target="_blank">
						{row.title}
					</a>
				)
			},
			{
				dataField: 'contest_id',
				text: 'Contest',
				formatter: (contest_id: string, problem: Problem) => {
					return (
						<a href={Url.formatContestUrl(contest_id)} target="_blank">
							{problem.contest.title}
						</a>
					);
				},
				sort: true
			},
			{
				dataField: 'id',
				text: 'Result',
				formatter: (id: string, problem: Problem) => {
					if (problem.status === 'AC') {
						return <p>AC</p>;
					} else if (problem.rivals.length > 0) {
						return <p>C</p>;
					} else {
						return <p>{problem.status}</p>;
					}
				}
			},
			{
				dataField: 'b',
				text: 'Last AC Date'
			},
			{
				dataField: 'solver_count',
				text: 'Solvers',
				formatter: (cell: number, row: Problem) => (
					<a href={Url.formatSolversUrl(row.contest_id, row.id)} target="_blank">
						{cell}
					</a>
				),
				sort: true
			},
			{
				dataField: 'showing_point',
				text: 'Point',
				sort: true,
				formatter: (showing_point: number) => {
					if (showing_point >= INF_POINT) {
						return '-';
					} else {
						if (showing_point % 100 == 0) {
							return showing_point;
						} else {
							return showing_point.toFixed(2);
						}
					}
				}
			},
			{
				dataField: 'execution_time',
				text: 'Fastest',
				formatter: (_: number, row: Problem) => (
					<a
						href={Url.formatSubmissionUrl(row.fastest_submission_id, row.fastest_contest_id)}
						target="_blank"
					>
						{row.fastest_user_id} ({row.execution_time} ms)
					</a>
				),
				sort: true
			},
			{
				dataField: 'source_code_length',
				text: 'Shortest',
				formatter: (_: number, row: Problem) => (
					<a
						href={Url.formatSubmissionUrl(row.shortest_submission_id, row.shortest_contest_id)}
						target="_blank"
					>
						{row.shortest_user_id} ({row.source_code_length} Bytes)
					</a>
				),
				sort: true
			},
			{
				dataField: 'first_user_id',
				text: 'First',
				formatter: (_: string, row: Problem) => (
					<a href={Url.formatSubmissionUrl(row.first_submission_id, row.first_contest_id)} target="_blank">
						{row.first_user_id}
					</a>
				)
			}
		];
		const options = {
			sizePerPageList: [
				{
					text: '25',
					value: 25
				},
				{
					text: '50',
					value: 50
				},
				{
					text: '100',
					value: 100
				}
			],
			custom: true,
			totalSize: this.state.problems.length
		};

		return (
			<PaginationProvider pagination={paginationFactory(options)}>
				{({ paginationProps, paginationTableProps }: any) => (
					<div>
						<PaginationListStandalone {...paginationProps} />
						<BootstrapTable keyField="id" columns={columns} data={this.state.problems} />
					</div>
				)}
			</PaginationProvider>
		);
	}
}

export default ListPage;
