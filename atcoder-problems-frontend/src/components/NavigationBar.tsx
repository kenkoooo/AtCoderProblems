import * as React from "react";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";
import { Arguments } from "../utils/Arguments";

interface NavigationBarProps {
  args: Arguments;
}
/**
 * The navigation bar which is always shown.
 * It doesn't have any status or props.
 */
export class NavigationBar extends React.Component<NavigationBarProps, {}> {
  render() {
    return (
      <Navbar inverse collapseOnSelect>
        <Navbar.Header>
          <Navbar.Brand>
            <a href={`./?user=${this.props.args.userId}`}>AtCoder Problems</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            <NavDropdown title="Rankings" id="basic-nav-dropdown">
              <MenuItem href="./?kind=ranking&ranking=ac">
                Accepted Count
              </MenuItem>
              <MenuItem href="./?kind=ranking&ranking=fast">
                Fastest Codes
              </MenuItem>
              <MenuItem href="./?kind=ranking&ranking=short">
                Shortest Codes
              </MenuItem>
              <MenuItem href="./?kind=ranking&ranking=first">
                First Acceptances
              </MenuItem>
              <MenuItem href="./?kind=ranking&ranking=sums">
                Rated-Point
              </MenuItem>
              <MenuItem href="./?kind=lang">Language Owners</MenuItem>
            </NavDropdown>
            <MenuItem href={`./?user=${this.props.args.userId}&kind=user`}>
              User Page
            </MenuItem>
            <NavDropdown title="Links" id="basic-nav-dropdown">
              <MenuItem href="https://atcoder.jp/">
                AtCoder Official Site
              </MenuItem>
              <MenuItem href="http://ichyo.jp/aoj-icpc/">AOJ-ICPC</MenuItem>
              <MenuItem href="https://github.com/kenkoooo/AtCoderProblems">
                Source Code (GitHub)
              </MenuItem>
              <MenuItem href="https://twitter.com/kenkoooo">@kenkoooo</MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}
