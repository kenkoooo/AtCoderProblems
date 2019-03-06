import React from 'react';
import { Container, Table } from 'reactstrap';
import * as ApiUrl from "../utils/Api";

interface User {
    problem_count: number;
    user_id: string;
}

interface State {
    data: User[];
    rank: number[];
}

class FastestRanking extends React.Component<{}, State> {
    constructor(props: any) {
        super(props);
        this.state = { data: [], rank: [] };
    }

    componentDidMount() {
        fetch(ApiUrl.FAST_COUNT_URL)
            .then(response => response.json())
            .then((data: User[]) => {
                data.sort((a, b) => b.problem_count - a.problem_count);
                let rank: number[] = [];
                let cur = 1;
                data.forEach((_, i) => {
                    if (i > 0 && data[i].problem_count < data[i - 1].problem_count) {
                        cur = i + 1;
                    }
                    rank.push(cur);
                });
                this.setState({ data, rank });
            });
    }

    render() {
        return (
            <Container>
                <Table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.data.map((user, i) => {
                            return (
                                <tr key={user.user_id}>
                                    <th scope="row">{this.state.rank[i]}</th>
                                    <td>{user.user_id}</td>
                                    <td>{user.problem_count}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Container>
        );
    }
}

export default FastestRanking;
