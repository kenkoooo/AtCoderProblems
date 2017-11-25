import * as React from "react";
import * as QueryString from "query-string";
import { SearchForm } from "./SearchForm";
import { Category } from "./Category";
import { Grid } from "react-bootstrap";
import { ApiCall } from "../utils/ApiCall"
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";

/**
 * Main view
 */
export class Application extends React.Component<{}, { problems: Array<Problem>, contests: Array<Contest> }> {

    constructor(props: {}, context?: any) {
        super(props, context);
        this.state = { problems: [], contests: [] }
    }

    fetchData() {
        ApiCall
            .getContests("http://localhost:3000/info/contests")
            .then(contests => this.setState({ contests: contests }))
            .catch((err) => { console.error(err); });
        ApiCall
            .getProblems("http://localhost:3000/info/problems")
            .then(problems => this.setState({ problems: problems }))
            .catch((err) => { console.error(err); });
    }

    componentWillMount() { this.fetchData(); }

    render() {
        // parse GET parameters
        let params = QueryString.parse(location.search);
        let userId = ("user" in params) ? params["user"] : "";
        let rivals = ("rivals" in params) ? params["rivals"] : "";
        let kind = ("kind" in params) ? params["kind"] : "category";
        return (
            <Grid>
                <SearchForm userId={userId} rivals={rivals} kind={kind} />
                <Category problems={this.state.problems} contests={this.state.contests} userId={userId} rivals={rivals.split(",")} />
            </Grid>
        );
    }
}
