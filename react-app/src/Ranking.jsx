import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import MyUtils from './MyUtils';

function userFormatter(cell, row) {
  return (
    <a href={`./?name=${cell}`}>{cell}</a>
  )
}

class Ranking extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ranking: []
    };
    this.kind = "";
    this.label = "";
    if (props.ranking === "1") {
      this.kind = "ac";
      this.label = "AC 数";
    }
    if (props.ranking === "2") {
      this.kind = "short";
      this.label = "ショートコード数";
    }
    if (props.ranking === "3") {
      this.kind = "fast";
      this.label = "最速実行数";
    }
    if (props.ranking === "4") {
      this.kind = "first";
      this.label = "最速提出数";
    }
  }
  componentDidMount() {
    MyUtils.getAPIPromise("/atcoder-api/ranking", {kind: this.kind}).then(json => this.setState({ranking: json}));
  }

  render() {
    if (this.state.ranking === []) {
      return (
        <div></div>
      );
    }
    console.log(this.state.ranking);
    return (
      <BootstrapTable data={this.state.ranking} striped>
        <TableHeaderColumn dataField="rank" isKey>#</TableHeaderColumn>
        <TableHeaderColumn dataField="user_name" dataFormat={userFormatter}>User</TableHeaderColumn>
        <TableHeaderColumn dataField="count">{this.label}</TableHeaderColumn>
      </BootstrapTable>
    );
  }
}

export default Ranking;
