import React from 'react';
import { Row, Col, Card, Container } from 'reactstrap';

import * as Api from '../utils/Api';

const ordinalNumbers = ["1st", "2nd", "3rd"];

interface Ranking {
    language: string,
    ranking: { name: string, count: number }[]
}

const OneOwner = (props: { entry: Ranking }) => (
    <Container className="my-5">
        <Row className="justify-content-center my-2 border-bottom"><h1>{props.entry.language}</h1></Row>
        <Row>
            {props.entry.ranking.slice(0, 3).map((rank, i) => (
                <Col key={rank.name} className="text-center">
                    <h5>{ordinalNumbers[i]}</h5>
                    <h3>{rank.name}</h3>
                    <h5 className="text-muted">{rank.count} AC</h5>
                </Col>
            ))}
        </Row>
    </Container>
);

interface State {
    rankings: Ranking[]
}

class LanguageOwners extends React.Component<{}, State> {
    constructor(props: any) {
        super(props);
        this.state = {
            rankings: []
        };
    }

    componentDidMount() {
        Api.fetchLangRanking().then(entries => {
            const map: Map<string, { name: string, count: number }[]> = new Map();
            entries.forEach(entry => {
                const e = {
                    name: entry.user_id,
                    count: entry.count,
                };
                const arr = map.get(entry.language);
                if (arr) {
                    arr.push(e);
                } else {
                    map.set(entry.language, [e]);
                }
            });

            const rankings = Array.from(map).map(entry => ({ language: entry[0], ranking: entry[1] }));
            rankings.forEach(ranking => ranking.ranking.sort((a, b) => b.count - a.count));
            this.setState({ rankings });
        });
    }
    render() {
        return (<div>
            {this.state.rankings.map(entry => <OneOwner key={entry.language} entry={entry} />)}
        </div>);
    }
}

export default LanguageOwners;