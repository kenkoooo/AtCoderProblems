import React from 'react';
import { Row } from 'reactstrap';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';

import * as Api from '../utils/Api';
import * as Url from '../utils/Url';
import Contest from '../interfaces/Contest';
import Problem from '../interfaces/Problem';

enum Status {
	Solved,
	RivalSolved,
	Trying
}

interface ProblemWithStatus extends Problem {
	status: Status;
	contest: Contest;
}

interface Props {
	user_ids: string[];
}

interface State {
	contests: Contest[];
	problems: ProblemWithStatus[];
}

class TablePage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			contests: [],
			problems: []
		};
	}
	componentDidMount() {
		Promise.all([ Api.fetchProblems(), Api.fetchContests() ]).then(([ initialProblems, contests ]) => {
			const contest_map = new Map(contests.map((c) => [ c.id, c ] as [string, Contest]));
			const problems = initialProblems.map((p) => {
				const contest = contest_map.get(p.contest_id);
				if (!contest) {
					throw `${p.contest_id} does not exist!`;
				}
				const status = Status.Trying;
				return { status, contest, ...p };
			});

			this.setState({ problems, contests });
		});
	}

	render() {
		const [ abc, arc ] = createAtCoderBeginnerRegularContestTable(this.state.contests, this.state.problems);
		const agc = createAtCoderGrandContestTable(this.state.contests, this.state.problems);
		abc.forEach((row) => {
			row.problems = row.problems.slice(0, 4);
		});
		arc.forEach((row) => {
			const length = row.problems.length;
			row.problems = row.problems.slice(length - 4, length);
		});
		return (
			<div>
				<Row>
					<h2>AtCoder Grand Contest</h2>
					<BootstrapTable data={agc} keyField="contest_id">
						<TableHeaderColumn
							dataField="contest_id"
							dataFormat={(contest_id: string) => (
								<a href={Url.formatContestUrl(contest_id)} target="_blank">
									{contest_id.toUpperCase()}
								</a>
							)}
						>
							Contest
						</TableHeaderColumn>
						{'ABCDEF'.split('').map((c, i) => (
							<TableHeaderColumn
								dataField={c}
								key={c}
								dataFormat={(_: any, row: { contest_id: string; problems: ProblemWithStatus[] }) => {
									const problem = row.problems[i];
									if (problem) {
										return (
											<a
												target="_blank"
												href={Url.formatProblemUrl(problem.id, problem.contest_id)}
											>
												{problem.title}
											</a>
										);
									} else {
										return '-';
									}
								}}
							>
								{c}
							</TableHeaderColumn>
						))}
					</BootstrapTable>
				</Row>
				<AtCoderRegularTable contests={abc} title="AtCoder Beginner Contest" />
				<AtCoderRegularTable contests={arc} title="AtCoder Regular Contest" />
			</div>
		);
	}
}

const AtCoderRegularTable = ({
	contests,
	title
}: {
	contests: { contest_id: string; problems: ProblemWithStatus[] }[];
	title: string;
}) => (
	<Row>
		<h2>{title}</h2>
		<BootstrapTable data={contests}>
			<TableHeaderColumn
				isKey
				dataField="contest_id"
				dataFormat={(_: any, row: { contest_id: string; problems: ProblemWithStatus[] }) => (
					<a href={Url.formatContestUrl(row.contest_id)} target="_blank">
						{row.contest_id}
					</a>
				)}
			>
				Contest
			</TableHeaderColumn>
			{'ABCD'.split('').map((c, i) => (
				<TableHeaderColumn
					dataField={c}
					key={c}
					dataFormat={(_: any, { problems }: { contest_id: string; problems: ProblemWithStatus[] }) => (
						<a href={Url.formatProblemUrl(problems[i].id, problems[i].contest_id)} target="_blank">
							{problems[i].title}
						</a>
					)}
				>
					{c}
				</TableHeaderColumn>
			))}
		</BootstrapTable>
	</Row>
);

const createAtCoderGrandContestTable = (contests: Contest[], problems: ProblemWithStatus[]) => {
	const map = new Map(
		contests.filter((c) => c.id.match(/^agc\d{3}$/)).map((c) => [ c.id, [] ] as [string, ProblemWithStatus[]])
	);
	problems.filter((p) => p.id.match(/^agc\d{3}_\w$/)).forEach((p) => {
		const contest_id = p.id.slice(0, 6);
		const list = map.get(contest_id);
		if (!list) {
			throw `${contest_id} does not exist!`;
		}
		list.push(p);
	});

	return Array.from(map)
		.sort(([ a, pa ], [ b, pb ]) => {
			if (b > a) {
				return 1;
			} else {
				return -1;
			}
		})
		.map(([ contest_id, problems ]) => {
			problems.sort((a, b) => {
				if (a.id > b.id) {
					return 1;
				} else {
					return -1;
				}
			});
			return { contest_id, problems };
		});
};

const createAtCoderBeginnerRegularContestTable = (contests: Contest[], problems: ProblemWithStatus[]) => {
	type Pair = [Contest, ProblemWithStatus[]];
	const abc_map = new Map(
		contests
			.filter((c) => c.id.match(/^abc\d{3}$/))
			.map((c) => [ c.start_epoch_second, [ c, [] ] ] as [number, Pair])
	);
	const arc_map = new Map(
		contests
			.filter((c) => c.id.match(/^arc\d{3}$/))
			.map((c) => [ c.start_epoch_second, [ c, [] ] ] as [number, Pair])
	);
	const pushToMap = (map: Map<number, Pair>) => {
		problems.forEach((p) => {
			const entry = map.get(p.contest.start_epoch_second);
			if (entry) {
				entry[1].push(p);
			}
		});
	};
	pushToMap(abc_map);
	pushToMap(arc_map);
	const sortMap = (map: Map<number, Pair>) => {
		return Array.from(map.values())
			.sort(([ a, pa ], [ b, pb ]) => b.start_epoch_second - a.start_epoch_second)
			.map(([ contest, problems ]) => {
				problems.sort((a, b) => {
					if (a.id > b.id) {
						return 1;
					} else {
						return -1;
					}
				});
				return { contest_id: contest.id, problems };
			});
	};
	const abc = sortMap(abc_map);
	const arc = sortMap(arc_map);
	return [ abc, arc ];
};

export default TablePage;
