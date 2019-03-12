import React from "react";
import { NavLink as RouterLink } from "react-router-dom";
import { withRouter, RouteComponentProps } from "react-router";
import {
  Navbar,
  NavbarBrand,
  Nav,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Form,
  Input,
  Button,
  FormGroup
} from "reactstrap";

enum PageKind {
  TABLE = "table",
  LIST = "list",
  USER = "user"
}

interface State {
  user_id: string;
  rival_id: string;
  kind: PageKind;
}

interface Props extends RouteComponentProps {}

class PrimitiveNavigationBar extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      user_id: "",
      rival_id: "",
      kind: PageKind.TABLE
    };
  }

  submit(nextKind: PageKind) {
    this.setState({ kind: nextKind });
    const { user_id, rival_id } = this.state;

    const users: string[] = [];
    if (user_id.match(/^[a-zA-Z0-9]*$/)) {
      users.push(user_id);
    }
    if (rival_id.match(/^[a-zA-Z0-9,]+$/)) {
      rival_id
        .split(",")
        .filter(user => user.length > 0)
        .forEach(user => users.push(user));
    }

    const current_pathname = this.props.history.location.pathname;

    const next_pathname = "/" + nextKind + "/" + users.join("/");
    if (current_pathname !== next_pathname) {
      this.props.history.push(next_pathname);
    }
  }

  componentWillMount() {
    let kind = PageKind.TABLE;
    const { pathname } = this.props.history.location;
    if (pathname.match(/^\/user/)) {
      kind = PageKind.USER;
    } else if (pathname.match(/^\/list/)) {
      kind = PageKind.LIST;
    }

    const params = pathname.split("/");
    const user_id = params.length >= 3 ? params[2] : "";
    const rival_id = params
      .slice(3)
      .filter(x => x.length > 0)
      .join(",");
    this.setState({ kind, user_id, rival_id });
  }

  render() {
    let root_url = "/";
    if (this.state.user_id.length > 0 || this.state.rival_id.length > 0) {
      root_url += "table/";
    }
    if (this.state.user_id.length > 0) {
      root_url += this.state.user_id + "/";
    }
    if (this.state.rival_id.length > 0) {
      root_url += this.state.rival_id
        .split(",")
        .filter(s => s.match(/^[0-9a-zA-Z_]+/))
        .join("/");
    }
    return (
      <Navbar color="light" light expand="md">
        <NavbarBrand tag={RouterLink} to={root_url}>
          AtCoder Problems
        </NavbarBrand>
        <Nav className="ml-auto" navbar>
          <Form inline>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <Input
                style={{ width: "150px" }}
                onKeyPress={e => {
                  if (e.key == "Enter") {
                    this.submit(this.state.kind);
                  }
                }}
                value={this.state.user_id}
                type="text"
                name="user_id"
                id="user_id"
                placeholder="User ID"
                onChange={e => this.setState({ user_id: e.target.value })}
              />
            </FormGroup>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <Input
                style={{ width: "150px" }}
                onKeyPress={e => {
                  if (e.key == "Enter") {
                    this.submit(this.state.kind);
                  }
                }}
                value={this.state.rival_id}
                type="text"
                name="rival_id"
                id="rival_id"
                placeholder="Rival ID, ..."
                onChange={e => this.setState({ rival_id: e.target.value })}
              />
            </FormGroup>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              onClick={() => {
                this.submit(PageKind.TABLE);
              }}
            >
              Table
            </Button>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              onClick={() => {
                this.submit(PageKind.LIST);
              }}
            >
              List
            </Button>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              onClick={() => {
                this.submit(PageKind.USER);
              }}
            >
              User Page
            </Button>
          </Form>
        </Nav>
        <Nav className="ml-auto" navbar>
          <UncontrolledDropdown nav inNavbar>
            <DropdownToggle nav caret>
              Rankings
            </DropdownToggle>
            <DropdownMenu right>
              <DropdownItem tag={RouterLink} to="/ac">
                AC Count
              </DropdownItem>
              <DropdownItem tag={RouterLink} to="/fast">
                Fastest Submissions
              </DropdownItem>
              <DropdownItem tag={RouterLink} to="/short">
                Shortest Submissions
              </DropdownItem>
              <DropdownItem tag={RouterLink} to="/first">
                First AC
              </DropdownItem>
              <DropdownItem tag={RouterLink} to="/sum">
                Rated Point Ranking
              </DropdownItem>
              <DropdownItem tag={RouterLink} to="/lang">
                Language Owners
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>

          <UncontrolledDropdown nav inNavbar>
            <DropdownToggle nav caret>
              Links
            </DropdownToggle>
            <DropdownMenu right>
              <DropdownItem tag="a" href="https://atcoder.jp/" target="_blank">
                AtCoder
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="http://aoj-icpc.ichyo.jp/"
                target="_blank"
              >
                AOJ-ICPC
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="https://github.com/kenkoooo/AtCoderProblems"
                target="_blank"
              >
                GitHub
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="https://twitter.com/kenkoooo"
                target="_blank"
              >
                @kenkoooo
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Nav>{" "}
      </Navbar>
    );
  }
}

const NavigationBar = withRouter(PrimitiveNavigationBar);

export default NavigationBar;
