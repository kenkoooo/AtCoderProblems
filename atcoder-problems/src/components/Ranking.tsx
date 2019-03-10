import React from 'react';
import { Row } from 'reactstrap';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';

interface Props {
	title: string;
	fetch: (() => Promise<{ count: number; id: string }[]>);
}

interface User {
	count: number;
	id: string;
	rank: number;
}

interface State {
	data: User[];
}

class Ranking extends React.Component<Props, State> {
	constructor(props: any) {
		super(props);
		this.state = { data: [] };
	}

	componentDidMount() {
		this.props.fetch().then((users) => {
			users.sort((a, b) => b.count - a.count);
			const rank: number[] = [];
			let cur = 1;
			users.forEach((_, i) => {
				if (i > 0 && users[i].count < users[i - 1].count) {
					cur = i + 1;
				}
				rank.push(cur);
			});
			const data = users.map((u, i) => ({
				count: u.count,
				id: u.id,
				rank: rank[i]
			}));
			this.setState({ data });
		});
	}

	render() {
		return (
			<Row>
				<h2>{this.props.title}</h2>
				<BootstrapTable
					height="auto"
					data={this.state.data}
					pagination
					striped
					hover
					options={{
						paginationPosition: 'top',
						sizePerPage: 20,
						sizePerPageList: [
							{
								text: '20',
								value: 20
							},
							{
								text: '50',
								value: 50
							},
							{
								text: '100',
								value: 100
							},
							{
								text: '200',
								value: 200
							},
							{
								text: 'All',
								value: this.state.data.length
							}
						]
					}}
				>
					<TableHeaderColumn dataField="rank">#</TableHeaderColumn>
					<TableHeaderColumn dataField="id" isKey>
						User
					</TableHeaderColumn>
					<TableHeaderColumn dataField="count">Count</TableHeaderColumn>
				</BootstrapTable>
			</Row>
		);
	}
}

export default Ranking;
