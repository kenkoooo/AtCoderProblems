import {PageHeader, Row} from 'react-bootstrap';
import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import MyUtils from './MyUtils'

function contestLinkFormatter(cell, row) {
  return (
    <a href={`https://${row.id}.contest.atcoder.jp/`} target="_blank">{row.name}</a>
  );
}

function columnClassNameFormatter(value, row, rowIndex, columnIndex) {
  if (row.result === "WIN") {
    return 'success';
  }
  if (row.result === "LOSE") {
    return 'danger';
  }
  if (row.result === "DRAW") {
    return 'warning';
  }
  return "";
}

class BattleTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
      rival: props.rival
    };
  }
  componentDidMount() {
    MyUtils.getAPIPromise("/atcoder-api/results", {
      user: this.state.user,
      rivals: this.state.rival
    }).then(json => {
      this.setState({results: json});
    });
    MyUtils.getAPIPromise("./json/contests.json", {}).then(json => {
      this.setState({contests: json});
    });
  }

  render() {
    if (this.state.results == null || this.state.contests == null) {
      return (
        <div></div>
      );
    }

    const merge = new Map();
    this.state.results.forEach(result => {
      if (!merge.has(result.contest)) {
        merge.set(result.contest, {
          date: "",
          me: -1,
          you: -1,
          result: ""
        });
      }
      if (result.user.toUpperCase() === this.state.user.toUpperCase()) {
        merge.get(result.contest).me = result.rank;
      }
      if (result.user.toUpperCase() === this.state.rival.toUpperCase()) {
        merge.get(result.contest).you = result.rank;
      }
    });
    this.state.contests.forEach(contest => {
      if (!merge.has(contest.id)) {
        merge.set(contest.id, {
          name: "",
          date: "",
          me: -1,
          you: -1,
          result: ""
        });
      }
      merge.get(contest.id).date = new Date(contest.start.replace(" ", "T") + "+00:00");
      merge.get(contest.id).name = contest.name;
    });

    const data = [];
    merge.forEach((value, key) => {
      if (value.date === "") {
        return;
      }
      value.id = key;
      if (value.me !== -1 && value.you !== -1) {
        if (value.me < value.you) {
          value.result = "WIN";
        }
        if (value.me > value.you) {
          value.result = "LOSE";
        }
        if (value.me === value.you) {
          value.result = "DRAW";
        }
      }
      if (value.me === -1) {
        value.me = "";
      }
      if (value.you === -1) {
        value.you = "";
      }
      data.push(value);
    });
    data.sort((a, b) => {
      if (a.date > b.date) {
        return -1;
      }
      if (a.date < b.date) {
        return 1;
      }
      return 0;
    });

    let win = 0;
    let lose = 0;
    let draw = 0;
    data.forEach(row => {
      if (row.result === "WIN") {
        win++;
      }
      if (row.result === "LOSE") {
        lose++;
      }
      if (row.result === "DRAW") {
        draw++;
      }
    });
    return (
      <Row>
        <PageHeader>{win}
          勝 {lose}
          敗 {draw}
          分</PageHeader>
        <BootstrapTable data={data} striped>
          <TableHeaderColumn dataSort={true} isKey dataField='id' dataFormat={contestLinkFormatter} columnClassName={columnClassNameFormatter}>
            コンテスト
          </TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='date' columnClassName={columnClassNameFormatter}>
            開催日
          </TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='me' columnClassName={columnClassNameFormatter}>
            順位
          </TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='you' columnClassName={columnClassNameFormatter}>
            ライバル
          </TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='result' columnClassName={columnClassNameFormatter}>
            結果
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    );
  }
}

export default BattleTable;
