import React, {Component} from 'react';
import {Navbar, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import Arguments from './Arguments';

class NavigationBar extends Component {
  constructor() {
    super();
    this.args = new Arguments();
  }

  render() {
    return (
      <Navbar inverse collapseOnSelect>
        <Navbar.Header>
          <Navbar.Brand>
            <a href={`./?name=${this.args.name}`}>AtCoder Problems</a>
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            <NavDropdown title="ランキング" id="basic-nav-dropdown">
              <MenuItem href="./?ranking=1">
                AC数
              </MenuItem>
              <MenuItem href="./?ranking=2">
                ショートコード数
              </MenuItem>
              <MenuItem href="./?ranking=3">
                最速実行コード数
              </MenuItem>
              <MenuItem href="./?ranking=4">
                First Acceptance
              </MenuItem>
            </NavDropdown>

            <MenuItem href={`./?kind=user&name=${this.args.name}`}>ユーザーページ</MenuItem>
            <NavDropdown title="リンク" id="basic-nav-dropdown">
              <MenuItem href="http://atcoder.jp/" target='_blank'>
                AtCoder (公式)
              </MenuItem>
              <MenuItem href="http://ichyo.jp/aoj-icpc/" target='_blank'>
                AOJ-ICPC
              </MenuItem>
              <MenuItem href="http://twitter.com/kenkoooo" target='_blank'>
                お問い合わせ
              </MenuItem>
              <MenuItem href="https://github.com/kenkoooo/AtCoderProblems" target='_blank'>
                GitHub
              </MenuItem>
              <MenuItem href="https://gist.github.com/kenkoooo/4618461adf0f5b4d3e3e" target='_blank'>
                非公式 API
              </MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default NavigationBar;
