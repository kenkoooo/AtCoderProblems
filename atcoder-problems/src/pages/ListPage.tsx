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

const StatelessTable = (props: {
	problems: Problem[];
	contestMap: Map<string, Contest>;
	statusMap: Map<string, { status: string; rivals: string[] }>;
}) => {
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
			formatter: (cell: string, row: Problem, i: number, data: { contestMap: Map<string, Contest> }) => {
				const contest = data.contestMap.get(cell);
				return (
					<a href={Url.formatContestUrl(cell)} target="_blank">
						{contest ? contest.title : ''}
					</a>
				);
			},
			formatExtraData: {
				contestMap: props.contestMap
			},
			sort: true
		},
		{
			dataField: 'id',
			text: 'Result',
			formatter: (
				id: string,
				problem: Problem,
				i: number,
				data: { statusMap: Map<string, { status: string; rivals: string[] }> }
			) => {
				const status = data.statusMap.get(id);
				if (id === 'code_festival_2015_okinawa_c') {
					console.log('a');
				}
				if (status) {
					if (status.status === 'AC') {
						return <p>AC</p>;
					} else if (status.rivals.length > 0) {
						return <p>RE</p>;
					} else {
						return <p>WA</p>;
					}
				} else {
					return null;
				}
			},
			formatExtraData: {
				statusMap: props.statusMap
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
				<a href={Url.formatSubmissionUrl(row.fastest_submission_id, row.fastest_contest_id)} target="_blank">
					{row.fastest_user_id} ({row.execution_time} ms)
				</a>
			),
			sort: true
		},
		{
			dataField: 'source_code_length',
			text: 'Shortest',
			formatter: (_: number, row: Problem) => (
				<a href={Url.formatSubmissionUrl(row.shortest_submission_id, row.shortest_contest_id)} target="_blank">
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
		// custom: true,
		totalSize: props.problems.length
	};

	const data: Problem[] = [];
	props.problems.forEach((p) => data.push(p));
	return (
		<PaginationProvider pagination={paginationFactory(options)}>
			{({ paginationProps, paginationTableProps }: any) => (
				<div>
					<PaginationListStandalone {...paginationProps} />
					<BootstrapTable keyField="id" columns={columns} data={data} {...paginationTableProps} />
				</div>
			)}
		</PaginationProvider>
	);
};

interface Problem extends MergedProblem {
	showing_point: number;
	date: string;
}

interface Props {
	user_ids: string[];
}

interface State {
	problems: Problem[];
	contestMap: Map<string, Contest>;
	statusMap: Map<string, { status: string; rivals: string[] }>;
	user_ids: string[];
}

class ListPage extends React.Component<Props, State> {
	constructor(props: any) {
		super(props);
		this.state = {
			problems: [],
			contestMap: new Map(),
			statusMap: new Map(),
			user_ids: []
		};
	}

	componentDidMount() {
		Promise.all([ Api.fetchMergedProblems(), Api.fetchContests() ]).then((result) => {
			const [ problems, contests ] = result;
			const contestMap = contests.reduce(
				(map, contest) => map.set(contest.id, contest),
				new Map<string, Contest>()
			);
			problems.sort((a, b) => {
				const contest_a = contestMap.get(a.contest_id);
				const contest_b = contestMap.get(b.contest_id);
				if (contest_a && contest_b) {
					if (contest_a.start_epoch_second == contest_b.start_epoch_second) {
						if (a.title < b.title) {
							return 1;
						} else if (a.title > b.title) {
							return -1;
						} else {
							return 0;
						}
					} else {
						return contest_b.start_epoch_second - contest_b.start_epoch_second;
					}
				} else {
					return 0;
				}
			});
			this.setState({
				problems: problems.map((problem) => {
					const p = problem as Problem;
					if (p.point) {
						p.showing_point = p.point;
					} else if (p.predict) {
						p.showing_point = p.predict;
					} else {
						p.showing_point = INF_POINT;
					}

					const contest = contestMap.get(p.contest_id);
					if (contest) {
						p.date = new Date(contest.start_epoch_second).toLocaleDateString();
					}

					return p;
				}),
				contestMap
			});
		});
	}

	componentDidUpdate() {
		if (this.props.user_ids == this.state.user_ids) {
			return;
		}
		this.updateProblems(this.props.user_ids);
	}

	updateProblems(user_ids: string[]) {
		Promise.all(user_ids.map(Api.fetchSubmissions)).then((r) => r.flat()).then((submissions) => {
			const user = this.props.user_ids.length > 0 ? this.props.user_ids[0] : '';
			const rivals = this.props.user_ids.slice(1);
			const statusMap = submissions.sort((a, b) => a.epoch_second - b.epoch_second).reduce((map, submission) => {
				let entry = map.get(submission.problem_id);
				if (!entry) {
					entry = { status: '', rivals: [] };
				}

				enum Pattern {
					MyAC,
					MyWA,
					OtherAC,
					Other
				}

				let pattern = Pattern.Other;
				if (submission.user_id == user) {
					if (submission.result === 'AC') {
						pattern = Pattern.MyAC;
					} else {
						pattern = Pattern.MyWA;
					}
				} else if (rivals.includes(submission.user_id) && submission.result === 'AC') {
					pattern = Pattern.OtherAC;
				}

				if (pattern == Pattern.MyAC) {
					entry.status = submission.result;
				} else if (pattern == Pattern.MyWA && entry.status !== 'AC') {
					entry.status = submission.result;
				} else if (pattern == Pattern.OtherAC) {
					entry.rivals.push(submission.user_id);
				}
				map.set(submission.problem_id, entry);
				return map;
			}, new Map<string, { status: string; rivals: string[] }>());
			this.setState({ statusMap, user_ids });
		});
	}

	render() {
		return (
			<StatelessTable
				problems={this.state.problems}
				statusMap={this.state.statusMap}
				contestMap={this.state.contestMap}
			/>
		);
	}
}

export default ListPage;
