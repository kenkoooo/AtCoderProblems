import React from "react";
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
import StreakRanking from "./pages/StreakRanking";
import ContestCreatePage from "./pages/Internal/VirtualContest/ContestCreatePage";
import ShowContest from "./pages/Internal/VirtualContest/ShowContest";
import UserConfigPage from "./pages/Internal/MyAccountPage";
import RecentContestList from "./pages/Internal/VirtualContest/RecentContestList";
import ContestUpdatePage from "./pages/Internal/VirtualContest/ContestUpdatePage";
import SingleProblemList from "./pages/Internal/ProblemList/SingleProblemList";
import { RecentSubmissions } from "./pages/RecentSubmissions";

const App = () => {
  return (
    <Router>
      <div>
        <NavigationBar />
        <Container style={{ width: "100%", maxWidth: "90%" }}>
          <Switch>
            <Route exact path="/ac" component={() => <ACRanking />} />
            <Route exact path="/fast" component={() => <FastestRanking />} />
            <Route exact path="/short" component={() => <ShortRanking />} />
            <Route exact path="/first" component={() => <FirstRanking />} />
            <Route exact path="/sum" component={() => <SumRanking />} />
            <Route exact path="/streak" component={() => <StreakRanking />} />
            <Route exact path="/lang" component={() => <LanguageOwners />} />
            <Route path="/user/:userIds([a-zA-Z0-9_]+)+" component={UserPage} />
            <Route
              path="/table/:userIds([a-zA-Z0-9_]*)*"
              component={TablePage}
            />
            <Route path="/list/:userIds([a-zA-Z0-9_]*)*" component={ListPage} />

            {/*Virtual Contests*/}
            <Route
              path="/contest/show/:contestId([a-zA-Z0-9_-]+)"
              component={ShowContest}
            />
            <Route path="/contest/create" component={ContestCreatePage} />
            <Route
              path="/contest/update/:contestId([a-zA-Z0-9_-]+)"
              component={ContestUpdatePage}
            />
            <Route path="/contest/recent" component={RecentContestList} />

            {/*User Settings*/}
            <Route path="/login/user" component={UserConfigPage} />

            {/*Problem List*/}
            <Route
              path="/problemlist/:listId([a-zA-Z0-9_-]+)"
              component={SingleProblemList}
            />
            <Route path="/submissions/recent" component={RecentSubmissions} />

            <Redirect path="/" to="/table/" />
          </Switch>
        </Container>
      </div>
    </Router>
  );
};

export default App;
