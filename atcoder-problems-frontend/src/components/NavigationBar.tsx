import React from "react";
import { NavLink as RouterLink } from "react-router-dom";
import { withRouter, RouteComponentProps } from "react-router";
import {
  Collapse,
  Navbar,
  NavbarBrand,
  NavbarToggler,
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
import {
  ATCODER_USER_REGEXP,
  ATCODER_RIVALS_REGEXP,
  extractRivalsParam
} from "../utils";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { List } from "immutable";
import { updateUserIds } from "../actions";

type PageKind = "table" | "list" | "user";

const extractPageKind = (pathname: string): PageKind => {
  if (pathname.match(/^\/user/)) {
    return "user";
  } else if (pathname.match(/^\/list/)) {
    return "list";
  } else {
    return "table";
  }
};

const extractUserIds = (pathname: string) => {
  const params = pathname.split("/");
  const userId = params.length >= 3 ? params[2] : "";
  const rivalIdString = params
    .slice(3)
    .filter(x => x.length > 0)
    .join(",");
  return { userId, rivalIdString };
};

interface Props extends RouteComponentProps {
  updateUserIds: (userId: string, rivals: List<string>) => void;
}

interface LocalState {
  isOpen: boolean;
  userId: string;
  rivalIdString: string;
  pageKind: PageKind;
}

class PrimitiveNavigationBar extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isOpen: false,
      userId: "",
      rivalIdString: "",
      pageKind: "table"
    };
  }

  submit(nextKind: PageKind) {
    const { userId, rivalIdString, pageKind } = this.state;

    const users: string[] = [];
    if (userId.match(ATCODER_USER_REGEXP)) {
      users.push(userId);
    } else {
      users.push("");
    }
    if (rivalIdString.match(ATCODER_RIVALS_REGEXP)) {
      const rivals = extractRivalsParam(rivalIdString);
      users.push(...rivals);
    }

    const currentPathname = this.props.location.pathname;
    const nextPathname = "/" + nextKind + "/" + users.join("/");
    if (currentPathname !== nextPathname || pageKind !== nextKind) {
      this.props.history.push(nextPathname);
      this.props.updateUserIds(userId, List(extractRivalsParam(rivalIdString)));
      this.setState({ pageKind: nextKind });
    }
  }

  componentDidMount() {
    const { pathname } = this.props.location;
    const pageKind = extractPageKind(pathname);
    const { userId, rivalIdString } = extractUserIds(pathname);
    this.setState({ userId, rivalIdString, pageKind });
    this.props.updateUserIds(userId, List(extractRivalsParam(rivalIdString)));
  }

  render() {
    const { userId, rivalIdString, isOpen, pageKind } = this.state;
    return (
      <Navbar color="light" light expand="lg" fixed="top">
        <NavbarBrand>AtCoder Problems</NavbarBrand>
        <NavbarToggler onClick={() => this.setState({ isOpen: !isOpen })} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="ml-auto" navbar>
            <Form inline>
              <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                <Input
                  style={{ width: "150px" }}
                  onKeyPress={e => {
                    if (e.key == "Enter") {
                      this.submit(pageKind);
                    }
                  }}
                  value={userId}
                  type="text"
                  name="user_id"
                  id="user_id"
                  placeholder="User ID"
                  onChange={e => this.setState({ userId: e.target.value })}
                />
              </FormGroup>
              <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                <Input
                  style={{ width: "150px" }}
                  onKeyPress={e => {
                    if (e.key == "Enter") {
                      this.submit(pageKind);
                    }
                  }}
                  value={rivalIdString}
                  type="text"
                  name="rival_id"
                  id="rival_id"
                  placeholder="Rival ID, ..."
                  onChange={e =>
                    this.setState({ rivalIdString: e.target.value })
                  }
                />
              </FormGroup>
              <Button
                className="mb-2 mr-sm-2 mb-sm-0"
                onClick={() => {
                  this.submit("table");
                }}
              >
                Table
              </Button>
              <Button
                className="mb-2 mr-sm-2 mb-sm-0"
                onClick={() => {
                  this.submit("list");
                }}
              >
                List
              </Button>
              <Button
                className="mb-2 mr-sm-2 mb-sm-0"
                disabled={userId.length === 0}
                onClick={() => {
                  this.submit("user");
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
                Other
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem tag={RouterLink} to="/monitor">
                  Monitoring
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Links
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem
                  tag="a"
                  href="https://atcoder.jp/"
                  target="_blank"
                >
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
        </Collapse>
      </Navbar>
    );
  }
}

const NavigationBar = withRouter(PrimitiveNavigationBar);

const stateToProps = () => ({});
const dispatchToProps = (dispatch: Dispatch) => ({
  updateUserIds: (userId: string, rivals: List<string>) =>
    dispatch(updateUserIds(userId, rivals))
});

export default connect(
  stateToProps,
  dispatchToProps
)(NavigationBar);
