import React from "react";
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import { Container } from "reactstrap";

import { List } from "immutable";
import { ACRanking } from "./pages/ACRanking";
import { FastestRanking } from "./pages/FastestRanking";
import { FirstRanking } from "./pages/FirstRanking";
import { ShortRanking } from "./pages/ShortRanking";
import { SumRanking } from "./pages/SumRanking";
import { LanguageOwners } from "./pages/LanguageOwners";
import { ListPage } from "./pages/ListPage";
import { UserPage } from "./pages/UserPage";
import { TablePage } from "./pages/TablePage";
import { NavigationBar } from "./components/NavigationBar";
import { StreakRanking } from "./pages/StreakRanking";
import { ContestCreatePage } from "./pages/Internal/VirtualContest/ContestCreatePage";
import { ShowContest } from "./pages/Internal/VirtualContest/ShowContest";
import { MyAccountPage } from "./pages/Internal/MyAccountPage";
import { RecentContestList } from "./pages/Internal/VirtualContest/RecentContestList";
import { ContestUpdatePage } from "./pages/Internal/VirtualContest/ContestUpdatePage";
import { SingleProblemList } from "./pages/Internal/ProblemList/SingleProblemList";
import { RecentSubmissions } from "./pages/RecentSubmissions";
import { TrainingPage } from "./pages/TrainingPage";
import { ACCOUNT_INFO } from "./utils/RouterPath";
import { ThemeProvider } from "./components/ThemeProvider";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div>
          <div className="sticky-top">
            <NavigationBar />
          </div>

          <Container
            className="my-5"
            style={{ width: "100%", maxWidth: "90%" }}
          >
            <Switch>
              <Route exact path="/ac" component={ACRanking} />
              <Route exact path="/fast" component={FastestRanking} />
              <Route exact path="/short" component={ShortRanking} />
              <Route exact path="/first" component={FirstRanking} />
              <Route exact path="/sum" component={SumRanking} />
              <Route exact path="/streak" component={StreakRanking} />
              <Route exact path="/lang" component={LanguageOwners} />
              <Route
                path="/user/:userIds([a-zA-Z0-9_]+)+"
                render={({ match }): React.ReactElement => {
                  const userIds: string | undefined = match.params.userIds;
                  const userId: string = (userIds ?? "").split("/")[0];
                  return <UserPage userId={userId} />;
                }}
              />
              <Route
                path="/table/:userIds([a-zA-Z0-9_]*)*"
                render={({ match }): React.ReactElement => {
                  const userIds: string | undefined = match.params.userIds;
                  const userId = (userIds ?? "").split("/")[0];
                  const rivals = (userIds ?? "/").split("/");
                  const rivalList = List(rivals)
                    .skip(1)
                    .filter((x) => x.length > 0);
                  return <TablePage userId={userId} rivals={rivalList} />;
                }}
              />
              <Route
                path="/list/:userIds([a-zA-Z0-9_]*)*"
                render={({ match }): React.ReactElement => {
                  const userIds: string | undefined = match.params.userIds;
                  const userId = (userIds ?? "").split("/")[0];
                  const rivals = (userIds ?? "/").split("/");
                  const rivalList = List(rivals)
                    .skip(1)
                    .filter((x) => x.length > 0);
                  return <ListPage userId={userId} rivals={rivalList} />;
                }}
              />

              {/*Virtual Contests*/}
              <Route
                path="/contest/show/:contestId([a-zA-Z0-9_-]+)"
                render={({ match }): React.ReactElement => {
                  const contestId: string = match.params.contestId ?? "";
                  return <ShowContest contestId={contestId} />;
                }}
              />
              <Route
                path="/contest/create"
                render={() => <ContestCreatePage />}
              />
              <Route
                path="/contest/update/:contestId([a-zA-Z0-9_-]+)"
                render={({ match }): React.ReactElement => {
                  const contestId: string = match.params.contestId ?? "";
                  return <ContestUpdatePage contestId={contestId} />;
                }}
              />
              <Route path="/contest/recent" component={RecentContestList} />

              {/*User Settings*/}
              <Route path={`${ACCOUNT_INFO}`} component={MyAccountPage} />

              {/*Problem List*/}
              <Route
                path="/problemlist/:listId([a-zA-Z0-9_-]+)"
                render={({ match }): React.ReactElement => {
                  const listId: string = match.params.listId ?? "";
                  return <SingleProblemList listId={listId} />;
                }}
              />
              <Route path="/submissions/recent" component={RecentSubmissions} />

              {/*Training*/}
              <Route path="/training" component={TrainingPage} />

              {/*Default Path*/}
              <Redirect path="/" to="/table/" />
            </Switch>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
  );
};

// eslint-disable-next-line import/no-default-export
export default App;
