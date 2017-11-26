import * as React from "react";
import * as QueryString from "query-string";
import { SearchForm } from "./SearchForm";
import { Category } from "./Category";
import { Grid } from "react-bootstrap";
import { ApiCall } from "../utils/ApiCall";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { ArgumentParser, Arguments } from "../utils/Arguments";

interface ApplicationState {
  problems: Array<Problem>;
  contests: Array<Contest>;
  submissions: Array<Submission>;
  args: Arguments;
}

/**
 * Main view
 */
export class Application extends React.Component<{}, ApplicationState> {
  constructor(props: {}, context?: any) {
    super(props, context);
    let args = ArgumentParser.parse();
    this.state = { problems: [], contests: [], submissions: [], args: args };
  }

  fetchData() {
    ApiCall.getContests("./atcoder-api/info/contests")
      .then(contests => this.setState({ contests: contests }))
      .catch(err => {
        console.error(err);
      });
    ApiCall.getProblems("./atcoder-api/info/problems")
      .then(problems => this.setState({ problems: problems }))
      .catch(err => {
        console.error(err);
      });

    ApiCall.getSubmissions("./atcoder-api/results", {
      user: this.state.args.userId,
      rivals: this.state.args.rivals
    })
      .then(submissions => this.setState({ submissions: submissions }))
      .catch(err => {
        console.error(err);
      });
  }

  componentWillMount() {
    this.fetchData();
  }

  render() {
    return (
      <Grid>
        <SearchForm args={this.state.args} />
        <Category
          problems={this.state.problems}
          contests={this.state.contests}
          userId={this.state.args.userId}
          rivals={this.state.args.rivals}
          submissions={this.state.submissions}
        />
      </Grid>
    );
  }
}
