import {PageHeader, Row, Label} from 'react-bootstrap';
import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import MyUtils from './MyUtils'

function statusFormatter(cell, row) {
  if (cell === "AC") {
    return (
      <h5>
        <Label bsStyle="success">{cell}</Label>
      </h5>
    );
  }
  if (row.rivals.length > 0) {
    const rivals = new Array(row.rivals.length).fill(0).map((_, i) => <h5 key={i}>
      <Label bsStyle="danger">{row.rivals[i]}</Label>
    </h5>);
    return (
      <div>{rivals}</div>
    );
  }
  if (cell !== "") {
    return (
      <h5>
        <Label bsStyle="warning">{cell}</Label>
      </h5>
    );
  }
  return (
    <h5></h5>
  );
}
function problemFormatter(cell, row) {
  return (
    <a href={`https://${row.contest}.contest.atcoder.jp/tasks/${row.id}`} target="_blank">
      {row.name}
    </a>
  );
}
function contestFormatter(cell, row) {
  return (
    <a href={`https://${row.contest}.contest.atcoder.jp/`} target="_blank">
      {row.contestName}
    </a>
  );
}
function solversFormatter(cell, row) {
  return (
    <a href={`http://${row.contest}.contest.atcoder.jp/submissions/all?task_screen_name=${row.id}&status=AC`} target="_blank">
      {row.solvers}
    </a>
  );
}
function firstFormatter(cell, row) {
  if (row.first_user === "") {
    return (
      <a></a>
    );
  }
  const contest = row.first_contest !== ""
    ? row.first_contest
    : row.contest;
  return (
    <a href={`http://${contest}.contest.atcoder.jp/submissions/${row.first_id}`} target="_blank">
      {row.first_user}
    </a>
  );
}
function fastestFormatter(cell, row) {
  if (row.fastest_user === "") {
    return (
      <a></a>
    );
  }
  const contest = row.fastest_contest !== ""
    ? row.fastest_contest
    : row.contest;
  return (
    <a href={`http://${contest}.contest.atcoder.jp/submissions/${row.fastest_id}`} target="_blank">
      {row.fastest_user}
      ({row.exec_time}{" "}
      ms)
    </a>
  );
}
function shortestFormatter(cell, row) {
  if (row.shortest_user === "") {
    return (
      <a></a>
    );
  }
  const contest = row.shortest_contest !== ""
    ? row.shortest_contest
    : row.contest;
  return (
    <a href={`http://${contest}.contest.atcoder.jp/submissions/${row.shortest_id}`} target="_blank">
      {row.shortest_user}
      ({row.source_length}{" "}
      bytes)
    </a>
  );
}

function columnClassName(value, row) {
  if (row.status === "AC") {
    return "success";
  }
  if (row.rivals.length > 0) {
    return "danger";
  }
  if (row.status !== "") {
    return "warning";
  }
  return "";
}

class ListTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
      rivals: props.rivals
    };
  }

  componentDidMount() {
    MyUtils.getAPIPromise("./json/contests.json", {}).then(json => {
      const map = new Map();
      json.forEach(contest => {
        map.set(contest.id, contest);
      });
      this.setState({contests: map});
    });

    MyUtils.getAPIPromise("./json/problems.json", {}).then(json => this.setState({problems: json}));

    MyUtils.getAPIPromise("/atcoder-api/problems", {
      user: this.state.user,
      rivals: this.state.rivals
    }).then(json => {
      const map = new Map();
      json.forEach(result => {
        map.set(result.id, result);
      });
      this.setState({results: map});
    });
  }

  render() {
    if (this.state.results == null || this.state.contests == null || this.state.problems == null) {
      return (
        <Row></Row>
      );
    }

    const problems = this.state.problems;
    problems.forEach(p => {
      const contest = this.state.contests.get(p.contest);
      p.date = contest.start.substring(0, 10);
      p.contestName = contest.name;

      p.status = "";
      p.rivals = [];
      const result = this.state.results.get(p.id);
      if (result == null) {
        return;
      }
      p.status = result.status;
      p.rivals = result.rivals;
    });

    return (
      <Row>
        <PageHeader></PageHeader>
        <BootstrapTable data={problems} striped search multiColumnSearch>
          <TableHeaderColumn dataSort={true} isKey dataField='problem' dataFormat={problemFormatter} columnClassName={columnClassName}>
            問題名</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='contest' dataFormat={contestFormatter} columnClassName={columnClassName}>
            コンテスト</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='date' columnClassName={columnClassName}>
            出題日</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='status' dataAlign='center' dataFormat={statusFormatter} columnClassName={columnClassName}>
            状態</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataAlign='right' dataField='solvers' dataFormat={solversFormatter} columnClassName={columnClassName}>
            解いた人数</TableHeaderColumn>
          <TableHeaderColumn dataField='fastest_user' dataSort={true} dataFormat={fastestFormatter} columnClassName={columnClassName}>
            最速実行</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='shortest_user' dataFormat={shortestFormatter} columnClassName={columnClassName}>
            ショートコード</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='first_user' dataFormat={firstFormatter} columnClassName={columnClassName}>
            最速提出</TableHeaderColumn>
          <TableHeaderColumn dataSort={true} dataField='difficulty' dataAlign='right' columnClassName={columnClassName}>
            ランク</TableHeaderColumn>
        </BootstrapTable>
      </Row>
    );
  }
}

export default ListTable;
