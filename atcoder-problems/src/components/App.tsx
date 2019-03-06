import React, { Component } from 'react';
import { HashRouter as Router, Route, NavLink as RouterLink, Switch } from "react-router-dom";
import { NavLink, Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

function Home() {
  return (<p>a</p>);
}
function Work() {
  return (<p>b</p>);
}

class App extends Component {
  render() {
    return (

      <Router>
        <div>
          <Navbar color="light" light expand="md">
            <NavbarBrand tag={RouterLink} to="/">reactstrap</NavbarBrand>
            <NavbarToggler />
            <Collapse navbar>
              <Nav className="ml-auto" navbar>
                <NavItem>
                  <NavLink tag={RouterLink} to="/b" className="nav-link">Components</NavLink>
                </NavItem>
                <NavItem>
                  <NavLink href="https://github.com/reactstrap/reactstrap" className="nav-link">GitHub</NavLink>
                </NavItem>
                <UncontrolledDropdown nav inNavbar>
                  <DropdownToggle nav caret>Options</DropdownToggle>
                  <DropdownMenu right>
                    <DropdownItem>Option 1</DropdownItem>
                    <DropdownItem>Option 2</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem>Reset</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </Nav>
            </Collapse>
          </Navbar>
          <Route exact path="/" component={Home} />
          <Route path="/b" component={Work} />
        </div>
      </Router>
    );
  }
}

export default App;
