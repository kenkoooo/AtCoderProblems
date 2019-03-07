import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
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

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <NavigationBar />
          <Container>
            <Switch>
              <Route exact path="/ac" component={ACRanking} />
              <Route exact path="/fast" component={FastestRanking} />
              <Route exact path="/short" component={ShortRanking} />
              <Route exact path="/first" component={FirstRanking} />
              <Route exact path="/sum" component={SumRanking} />
              <Route exact path="/lang" component={LanguageOwners} />
              <Route
                path="/user/:user_id([a-zA-Z0-9]+)*"
                component={(props: any) => {
                  const user_id = props.match.params.user_id;
                  const user_ids = user_id ? user_id.split("/") : [];
                  return <UserPage user_ids={user_ids} />;
                }}
              />
              <Route
                path="/table/:user_id([a-zA-Z0-9]+)*"
                component={(props: any) => {
                  const user_id = props.match.params.user_id;
                  const user_ids = user_id ? user_id.split("/") : [];
                  return <TablePage user_ids={user_ids} />;
                }}
              />
              <Route
                path="/list/:user_id([a-zA-Z0-9]+)*"
                component={(props: any) => {
                  const user_id = props.match.params.user_id;
                  const user_ids = user_id ? user_id.split("/") : [];
                  return <ListPage user_ids={user_ids} />;
                }}
              />

              <Route component={TablePage} />
            </Switch>
          </Container>
        </div>
      </Router>
    );
  }
}

export default App;
