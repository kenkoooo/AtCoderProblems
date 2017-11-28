import * as React from "react";
import * as QueryString from "query-string";
import { SearchForm } from "./SearchForm";
import { Category } from "./Category";
import { List } from "./List";
import { Grid } from "react-bootstrap";
import { ApiCall } from "../utils/ApiCall";
import { Problem } from "../model/Problem";
import { Contest } from "../model/Contest";
import { Submission } from "../model/Submission";
import { ArgumentParser, Arguments } from "../utils/Arguments";
import { MergedProblem } from "../model/MergedProblem";
import { SubmissionUtlis } from "../utils/SubmissionUtils";
import { NavigationBar } from "./NavigationBar";
import { UserPage } from "./UserPage";

interface ApplicationState {
  problems: Array<Problem>;
  contests: Array<Contest>;
  submissions: Array<Submission>;
  mergedProblems: Array<MergedProblem>;
  args: Arguments;
}

enum ViewKind {
  Category = "category",
  List = "list",
  User = "user"
}

/**
 * Main view
 */
export class Application extends React.Component<{}, ApplicationState> {
  constructor(props: {}, context?: any) {
    super(props, context);
    let args = ArgumentParser.parse();
    this.state = {
      problems: [],
      contests: [],
      submissions: [],
      mergedProblems: [],
      args: args
    };
  }

  setContests() {
    ApiCall.getContests("./atcoder-api/info/contests")
      .then(contests => this.setState({ contests: contests }))
      .catch(err => console.error(err));
  }
  setProblems() {
    ApiCall.getProblems("./atcoder-api/info/problems")
      .then(problems => this.setState({ problems: problems }))
      .catch(err => console.error(err));
  }
  setMergedProblems() {
    ApiCall.getMergedProblems("./atcoder-api/info/merged-problems")
      .then(problems => this.setState({ mergedProblems: problems }))
      .catch(err => console.error(err));
  }
  setSubmissions() {
    ApiCall.getSubmissions("./atcoder-api/results", {
      user: this.state.args.userId,
      rivals: this.state.args.rivals
    })
      .then(submissions => this.setState({ submissions: submissions }))
      .catch(err => console.error(err));
  }

  componentWillMount() {
    switch (this.state.args.kind) {
      case ViewKind.Category:
        this.setContests();
        this.setProblems();
        this.setSubmissions();
        break;
      case ViewKind.List:
        this.setContests();
        this.setMergedProblems();
        this.setSubmissions();
        break;
      case ViewKind.User:
        this.setProblems();
        this.setSubmissions();
        break;

      default:
        break;
    }
  }

  chooseByKind() {
    let acceptedProblems = new Set(
      SubmissionUtlis.extractProblemIdsByUsers(
        this.state.submissions,
        new Set([this.state.args.userId])
      ).keys()
    );
    let wrongProblemMap = SubmissionUtlis.extractProblemIdsByUsers(
      this.state.submissions,
      new Set([this.state.args.userId]),
      new Set(["WA", "TLE", "MLE", "RE"])
    );

    switch (this.state.args.kind) {
      case ViewKind.Category:
        let rivalProblems = new Set(
          SubmissionUtlis.extractProblemIdsByUsers(
            this.state.submissions,
            new Set(this.state.args.rivals)
          ).keys()
        );
        return (
          <Category
            problems={this.state.problems}
            contests={this.state.contests}
            userId={this.state.args.userId}
            rivals={this.state.args.rivals}
            acceptedProblems={acceptedProblems}
            wrongMap={wrongProblemMap}
            rivalProblems={rivalProblems}
          />
        );
      case ViewKind.List:
        let rivalSet = new Set(this.state.args.rivals);
        let rivalMap = new Map<string, Set<string>>();

        this.state.submissions
          .filter(s => rivalSet.has(s.user_id) && s.result == "AC")
          .forEach(s => {
            if (!rivalMap.has(s.problem_id)) {
              rivalMap.set(s.problem_id, new Set<string>());
            }
            rivalMap.get(s.problem_id).add(s.user_id);
          });
        return (
          <List
            problems={this.state.mergedProblems}
            contests={this.state.contests}
            acceptedProblems={acceptedProblems}
            wrongMap={wrongProblemMap}
            rivalMap={rivalMap}
          />
        );
      case ViewKind.User:
        return (
          <UserPage
            userId={this.state.args.userId}
            submissions={this.state.submissions}
            problems={this.state.problems}
          />
        );

      default:
        return <span />;
    }
  }

  render() {
    return (
      <div>
        <NavigationBar args={this.state.args} />
        <Grid>
          <SearchForm args={this.state.args} />
          {this.chooseByKind()}
        </Grid>
      </div>
    );
  }
}
