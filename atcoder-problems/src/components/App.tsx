import React, { Component } from 'react';
import { HashRouter as Router, Route, NavLink as RouterLink, Switch } from "react-router-dom";
import { NavLink, Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

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
                    <DropdownItem tag={RouterLink} to="/ac">Accepted Count</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/fast">Fastest Submission</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/short">Shortest Submission</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/first">First AC</DropdownItem>
                    <DropdownItem tag={RouterLink} to="/sum">Rated Point</DropdownItem>
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
          <Switch>
            <Route exact path="/ac" component={() => <div>ac</div>} />
            <Route exact path="/fast" component={() => <div>fast</div>} />
            <Route exact path="/short" component={() => <div>short</div>} />
            <Route exact path="/first" component={() => <div>first</div>} />
            <Route exact path="/sum" component={() => <div>sum</div>} />
            <Route exact path="/lang" component={() => <div>lang</div>} />
            <Route path="/user/:user_id" component={(props: any) => <div>user: {props.match.params.user_id}</div>} />

            <Route component={() => <div>home</div>} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
