import React, { Component } from 'react';
import { HashRouter as Router, Route, NavLink as RouterLink, Switch } from "react-router-dom";
import {
  NavLink, Navbar, NavbarBrand, NavbarToggler, Collapse,
  Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Container
} from 'reactstrap';

import ACRanking from "./pages/ACRanking";
import FastestRanking from "./pages/FastestRanking";
import FirstRanking from "./pages/FirstRanking";
import ShortRanking from "./pages/ShortRanking";
import SumRanking from "./pages/SumRanking";
import LanguageOwners from "./pages/LanguageOwners";

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Navbar color="light" light expand="md">
            <NavbarBrand tag={RouterLink} to="/">AtCoder Problems</NavbarBrand>
            <NavbarToggler />
            <Collapse navbar>
              <Nav className="ml-auto" navbar>
                <UncontrolledDropdown nav inNavbar>
                  <DropdownToggle nav caret>Rankings</DropdownToggle>
                  <DropdownMenu right>
                    <DropdownItem tag={RouterLink} to="/ac">AC Count</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/fast">Fastest Submissions</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/short">Shortest Submissions</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/first">First AC</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/sum">Rated Point Ranking</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/lang">Language Owners</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>

                <NavItem>
                  <NavLink tag={RouterLink} to="/user">User Page</NavLink>
                </NavItem>

                <NavItem>
                  <NavLink href="https://github.com/reactstrap/reactstrap">GitHub</NavLink>
                </NavItem>

                <UncontrolledDropdown nav inNavbar>
                  <DropdownToggle nav caret>Links</DropdownToggle>
                  <DropdownMenu right>
                    <DropdownItem tag="a" href="https://atcoder.jp/" target="_blank">AtCoder</DropdownItem>
                    <DropdownItem tag="a" href="http://aoj-icpc.ichyo.jp/" target="_blank">AOJ-ICPC</DropdownItem>
                    <DropdownItem tag="a" href="https://github.com/kenkoooo/AtCoderProblems" target="_blank">GitHub</DropdownItem>
                    <DropdownItem tag="a" href="https://twitter.com/kenkoooo" target="_blank">@kenkoooo</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </Nav>
            </Collapse>
          </Navbar>
          <Container>
            <Switch>
              <Route exact path="/ac" component={ACRanking} />
              <Route exact path="/fast" component={FastestRanking} />
              <Route exact path="/short" component={ShortRanking} />
              <Route exact path="/first" component={FirstRanking} />
              <Route exact path="/sum" component={SumRanking} />
              <Route exact path="/lang" component={LanguageOwners} />
              <Route path="/user/:user_id" component={(props: any) => <div>user: {props.match.params.user_id}</div>} />

              <Route component={() => <div>home</div>} />
            </Switch>
          </Container>
        </div>
      </Router>
    );
  }
}

export default App;
