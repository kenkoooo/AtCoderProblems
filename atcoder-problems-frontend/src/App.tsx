import React, { Component } from "react";
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect
} from "react-router-dom";
import { Container } from "reactstrap";

import ACRanking from "./pages/ACRanking";
import FastestRanking from "./pages/FastestRanking";
import FirstRanking from "./pages/FirstRanking";
import ShortRanking from "./pages/ShortRanking";
import SumRanking from "./pages/SumRanking";
import LanguageOwners from "./pages/LanguageOwners";
import ListPage from "./pages/ListPage";
import UserPage from "./pages/UserPage";
import TablePage from "./pages/TablePage";

import NavigationBar from "./components/NavigationBar";
import { ATCODER_USER_REGEXP, ATCODER_RIVALS_REGEXP } from "./utils";
type MatchUserId = { match: { params: { user_id?: string } } };
const extractUserId = ({
  match: {
    params: { user_id }
  }
}: MatchUserId) => (user_id ? user_id.split("/") : []);

class App extends Component {
  render() {
    const params = new URLSearchParams(location.search);
    const user_param = params.get("user");
    const rivals_param = params.get("rivals");
    const kind_param = params.get("kind");

    return (
      <Router>
        <div>
          <NavigationBar />
          <Container style={{ width: "100%", maxWidth: "90%" }}>
            <Switch>
              <Route exact path="/ac" component={ACRanking} />
              <Route exact path="/fast" component={FastestRanking} />
              <Route exact path="/short" component={ShortRanking} />
              <Route exact path="/first" component={FirstRanking} />
              <Route exact path="/sum" component={SumRanking} />
              <Route exact path="/lang" component={LanguageOwners} />
              <Route
                path="/user/:user_id([a-zA-Z0-9_]*)*"
                component={(props: MatchUserId) => (
                  <UserPage user_ids={extractUserId(props)} />
                )}
              />
              <Route
                path="/table/:user_id([a-zA-Z0-9_]*)*"
                component={(props: MatchUserId) => (
                  <TablePage user_ids={extractUserId(props)} />
                )}
              />
              <Route
                path="/list/:user_id([a-zA-Z0-9_]*)*"
                component={(props: MatchUserId) => (
                  <ListPage user_ids={extractUserId(props)} />
                )}
              />
              <Route
                exact
                path="/"
                render={() => {
                  const user =
                    user_param != null && user_param.match(ATCODER_USER_REGEXP)
                      ? user_param
                      : "";
                  const rivals =
                    rivals_param != null &&
                      rivals_param.match(ATCODER_RIVALS_REGEXP)
                      ? rivals_param.split(",")
                      : [];
                  const kind =
                    kind_param === "list"
                      ? "list"
                      : kind_param === "user"
                        ? "user"
                        : "table";

                  return (
                    <Redirect to={`/${kind}/${user}/${rivals.join("/")}`} />
                  );
                }}
              />
            </Switch>
          </Container>
        </div>
      </Router>
    );
  }
}

export default App;
