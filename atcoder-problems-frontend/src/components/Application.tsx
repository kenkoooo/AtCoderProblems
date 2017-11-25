import * as React from "react";
import * as QueryString from "query-string";
import { SearchForm } from "./SearchForm";
import { Category } from "./Category";
import { Grid } from "react-bootstrap";
import { ApiCall } from "../utils/ApiCall"
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { ArgumentParser } from "../utils/Arguments";

interface ApplicationState {
    problems: Array<Problem>, contests: Array<Contest>, submissions: Array<Submission>
}

/**
 * Main view
 */
export class Application extends React.Component<{}, ApplicationState> {

    constructor(props: {}, context?: any) {
        super(props, context);
        this.state = { problems: [], contests: [], submissions: [] }
    }

    fetchData() {
        ApiCall
            .getContests("./atcoder-api/info/contests")
            .then(contests => this.setState({ contests: contests }))
            .catch((err) => { console.error(err); });
        ApiCall
            .getProblems("./atcoder-api/info/problems")
            .then(problems => this.setState({ problems: problems }))
            .catch((err) => { console.error(err); });
    }

    componentWillMount() { this.fetchData(); }

    render() {
        // parse GET parameters
        let args = ArgumentParser.parse();

        return (
            <Grid>
                <SearchForm args={args} />
                <Category problems={this.state.problems} contests={this.state.contests} userId={args.userId} rivals={args.rivals} />
            </Grid>
        );
    }
}
