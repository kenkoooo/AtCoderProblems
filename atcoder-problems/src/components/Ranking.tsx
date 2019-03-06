import React from 'react';
import { Row } from 'reactstrap';

const BootstrapTable = require("react-bootstrap-table-next").default;
const paginationFactory = require("react-bootstrap-table2-paginator").default;


interface Props {
    title: string;
    fetch: (() => Promise<{count:number,id:string}[]>);
}

interface User {
    count: number;
    id: string;
    rank: number;
}

interface State {
    data: User[];
}

class Ranking extends React.Component<Props, State>{
    constructor(props: any) {
        super(props);
        this.state = { data: [] };
    }

    componentDidMount() {
        this.props.fetch().then(users => {
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
        const columns = [{
            dataField: 'rank',
            text: 'Rank'
        }, {
            dataField: 'id',
            text: 'User'
        }, {
            dataField: 'count',
            text: 'Count'
        }];
        const options = {
            sizePerPageList: [{
                text: '25', value: 25
            }, {
                text: '50', value: 50
            }, {
                text: '100', value: 100
            }]
        };
        return (
            <Row>
                <h2>{this.props.title}</h2>
                <BootstrapTable
                    keyField='id'
                    columns={columns}
                    data={this.state.data}
                    pagination={paginationFactory(options)} />
            </Row>
        );
    }
}

export default Ranking;