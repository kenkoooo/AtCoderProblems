import {Label} from 'react-bootstrap';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import React, {Component} from 'react';
import MyUtils from './MyUtils';

function statusFormatter(cell, row) {
  if (cell) {
    return (
      <h5>
        <Label bsStyle="success">AC</Label>
      </h5>
    );
  }
  return (
    <h5></h5>
  );
}

class PracticeTable extends Component {
  constructor(props) {
    super(props);
    const problems = props.problems.split(",");
    this.state = {
      selected: problems,
      users: props.users
    };
  }

  componentDidMount() {
    MyUtils.getAPIPromise("./json/problems_simple.json", {}).then(json => {
      const map = new Map();
      json.forEach(problem => {
        map.set(problem.id, problem);
      });
      this.setState({problems: map});
    });

    MyUtils.getAPIPromise("/atcoder-api/problems", {rivals: this.state.users.join(",")}).then(json => {
      const map = new Map();
      json.forEach(result => {
        map.set(result.id, result);
      });
      this.setState({results: map});
    });
  }

  render() {
    if (this.state.results == null || this.state.problems == null) {
      return (
        <div></div>
      );
    }

    const users = new Array(this.state.users.length).fill(0).map((_, i) => {
      return {user: this.state.users[i]};
    });

    const columns = [];
    this.state.selected.forEach((x, i) => {
      if (!this.state.problems.has(x)) {
        return;
      }
      const problem = this.state.problems.get(x);
      const key = i.toString(10);
      columns.push(
        <TableHeaderColumn dataField={key} key={key} dataFormat={statusFormatter} dataAlign='center'>
          <a href={`https://${problem.contest}.contest.atcoder.jp/tasks/${problem.id}`} target="_blank">
            {problem.name}
          </a>
        </TableHeaderColumn>
      );

      if (!this.state.results.has(x)) {
        return;
      }
      const result = this.state.results.get(x);
      users.forEach(user => {
        if (result.rivals.indexOf(user.user) !== -1) {
          user[key] = true;
        } else {
          user[key] = false;
        }
      });
    });
    return (
      <BootstrapTable data={users} striped>
        <TableHeaderColumn dataField="user" isKey>#</TableHeaderColumn>
        {columns}
      </BootstrapTable>
    );
  }
}

export default PracticeTable;
