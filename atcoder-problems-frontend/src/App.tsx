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
import { ListPage } from "./pages/ListPage";
import { UserPage } from "./pages/UserPage";
import { TablePage } from "./pages/TablePage";
import { NavigationBar } from "./components/NavigationBar";
import StreakRanking from "./pages/StreakRanking";
import ContestCreatePage from "./pages/Internal/VirtualContest/ContestCreatePage";
import ShowContest from "./pages/Internal/VirtualContest/ShowContest";
import UserConfigPage from "./pages/Internal/MyAccountPage";
import { RecentContestList } from "./pages/Internal/VirtualContest/RecentContestList";
import ContestUpdatePage from "./pages/Internal/VirtualContest/ContestUpdatePage";
import SingleProblemList from "./pages/Internal/ProblemList/SingleProblemList";
import { RecentSubmissions } from "./pages/RecentSubmissions";
import { List } from "immutable";
import { TabFrame } from "./components/TabFrame";
import { Courses } from "./pages/Courses";

const App = () => {
  return (
    <Router>
      <div>
        <NavigationBar />
        <Container style={{ width: "100%", maxWidth: "90%" }}>
          <Switch>
            <Route
              exact
              path="/ac"
              component={() => (
                <TabFrame>
                  <ACRanking />
                </TabFrame>
              )}
            />
            <Route
              exact
              path="/fast"
              component={() => (
                <TabFrame>
                  <FastestRanking />
                </TabFrame>
              )}
            />
            <Route
              exact
              path="/short"
              component={() => (
                <TabFrame>
                  <ShortRanking />
                </TabFrame>
              )}
            />
            <Route
              exact
              path="/first"
              component={() => (
                <TabFrame>
                  <FirstRanking />
                </TabFrame>
              )}
            />
            <Route
              exact
              path="/sum"
              component={() => (
                <TabFrame>
                  <SumRanking />
                </TabFrame>
              )}
            />
            <Route
              exact
              path="/streak"
              component={() => (
                <TabFrame>
                  <StreakRanking />
                </TabFrame>
              )}
            />
            <Route
              exact
              path="/lang"
              component={() => (
                <TabFrame>
                  <LanguageOwners />
                </TabFrame>
              )}
            />
            <Route
              path="/user/:userIds([a-zA-Z0-9_]+)+"
              render={({ match }) => {
                const userIds: string | undefined = match.params.userIds;
                const userId: string = (userIds ?? "").split("/")[0];
                return (
                  <TabFrame>
                    <UserPage userId={userId} />
                  </TabFrame>
                );
              }}
            />
            <Route
              path="/table/:userIds([a-zA-Z0-9_]*)*"
              render={({ match }) => {
                const userIds: string | undefined = match.params.userIds;
                const userId = (userIds ?? "").split("/")[0];
                const rivals = (userIds ?? "/").split("/");
                const rivalList = List(rivals)
                  .skip(1)
                  .filter(x => x.length > 0);
                return (
                  <TabFrame>
                    <TablePage userId={userId} rivals={rivalList} />
                  </TabFrame>
                );
              }}
            />
            <Route
              path="/list/:userIds([a-zA-Z0-9_]*)*"
              render={({ match }) => {
                const userIds: string | undefined = match.params.userIds;
                const userId = (userIds ?? "").split("/")[0];
                const rivals = (userIds ?? "/").split("/");
                const rivalList = List(rivals)
                  .skip(1)
                  .filter(x => x.length > 0);
                return (
                  <TabFrame>
                    <ListPage userId={userId} rivals={rivalList} />
                  </TabFrame>
                );
              }}
            />

            {/*Virtual Contests*/}
            <Route
              path="/contest/show/:contestId([a-zA-Z0-9_-]+)"
              component={() => (
                <TabFrame>
                  <ShowContest />
                </TabFrame>
              )}
            />
            <Route
              path="/contest/create"
              component={() => (
                <TabFrame>
                  <ContestCreatePage />
                </TabFrame>
              )}
            />
            <Route
              path="/contest/update/:contestId([a-zA-Z0-9_-]+)"
              component={() => (
                <TabFrame>
                  <ContestUpdatePage />
                </TabFrame>
              )}
            />
            <Route
              path="/contest/recent"
              component={() => (
                <TabFrame>
                  <RecentContestList />
                </TabFrame>
              )}
            />

            {/*User Settings*/}
            <Route
              path="/login/user"
              component={() => (
                <TabFrame>
                  <UserConfigPage />
                </TabFrame>
              )}
            />

            {/*Problem List*/}
            <Route
              path="/problemlist/:listId([a-zA-Z0-9_-]+)"
              component={() => (
                <TabFrame>
                  <SingleProblemList />
                </TabFrame>
              )}
            />
            <Route
              path="/submissions/recent"
              component={() => (
                <TabFrame>
                  <RecentSubmissions />
                </TabFrame>
              )}
            />

            {/*Courses*/}
            <Route
              path="/courses"
              component={() => (
                <TabFrame>
                  <Courses />
                </TabFrame>
              )}
            />
            <Redirect path="/" to="/table/" />
          </Switch>
        </Container>
      </div>
    </Router>
  );
};

export default App;
