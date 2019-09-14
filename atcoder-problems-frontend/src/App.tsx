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
import ReviewPage from "./pages/ReviewPage";

const App = () => (
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
          <Route exact path="/lang" component={() => <LanguageOwners />} />
          <Route exact path="/review/([a-zA-Z0-9_]*)*" component={ReviewPage} />
          <Route path="/user/([a-zA-Z0-9_]*)*" component={() => <UserPage />} />
          <Route
            path="/table/([a-zA-Z0-9_]*)*"
            component={() => <TablePage />}
          />
          <Route path="/list/([a-zA-Z0-9_]*)*" component={() => <ListPage />} />
          <Redirect path="/" to="/table/" />
        </Switch>
      </Container>
    </div>
  </Router>
);

export default App;
