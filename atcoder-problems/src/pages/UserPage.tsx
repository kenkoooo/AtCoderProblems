import React from 'react';
import { Row, Col } from 'reactstrap';

import * as Api from '../utils/Api';
import Submission from '../interfaces/Submission';
import UserInfo from '../interfaces/UserInfo';
import MergedProblem from '../interfaces/MergedProblem';
import { ordinalSuffixOf } from '../utils';

interface Props {
	user_ids: string[];
}

interface State {
	problems: MergedProblem[];
	submissions: Submission[];
	user_info: UserInfo;
}

class UserPage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			problems: [],
			submissions: [],
			user_info: {
				accepted_count: 1e9 + 7,
				accepted_count_rank: 1e9 + 7,
				rated_point_sum: 1e9 + 7,
				rated_point_sum_rank: 1e9 + 7,
				user_id: ''
			}
		};
	}
	componentDidMount() {
		Api.fetchMergedProblems().then((problems) => this.setState({ problems }));
		this.updateState(this.getUserIdFromProps());
	}
	componentDidUpdate(prevProps: Props) {
		if (this.props !== prevProps) {
			this.updateState(this.getUserIdFromProps());
		}
	}

	updateState(user_id: string) {
		Api.fetchSubmissions(user_id).then((submissions) => this.setState({ submissions }));
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

		const { submissions, user_info } = this.state;

		const achievements = [
			{ key: 'Accepted', value: user_info.accepted_count, rank: user_info.accepted_count_rank }
		];

		return (
			<div>
				<Row className="my-2 border-bottom">
					<h1>{user_id}</h1>
				</Row>{' '}
				<Row>
					{achievements.map(({ key, value, rank }) => (
						<Col key={key} className="text-center">
							<h5>{key}</h5>
							<h3>{value}</h3>
							<h5 className="text-muted">{`${rank} ${ordinalSuffixOf(rank)}`}</h5>
						</Col>
					))}
				</Row>
			</div>
		);
	}
}

export default UserPage;
