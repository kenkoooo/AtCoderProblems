import {
  FormGroup,
  FormControl,
  Button,
  ControlLabel,
  PageHeader,
  Row,
  Form,
  Radio,
  Checkbox
} from 'react-bootstrap';
import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import MyUtils from './MyUtils';

function problemLinkFormatter(cell, row) {
  if (cell == null)
    return (
      <span>-</span>
    );
  return (
    <a href={`https://${row.id}.contest.atcoder.jp/tasks/${cell.id}`} target="_blank">{cell.name}</a>
  );
}

function contestLinkFormatter(cell, row) {
  return (
    <a href={`https://${row.id}.contest.atcoder.jp/`} target="_blank">{cell.toUpperCase()}</a>
  );
}

function mergeProblems(problems, regex) {
  const contests = new Map();
  problems.forEach(problem => {
    const contest = problem.contest;
    if (contest.match(regex)) {
      if (!contests.has(contest)) {
        contests.set(contest, []);
      }
      contests.get(contest).push({id: problem.id, name: problem.name});
    }
  });
  contests.forEach((v, k) => {
    v.sort((a, b) => {
      if (a.id > b.id)
        return 1;
      if (a.id < b.id)
        return -1;
      return 0;
    });
  });
  return contests;
}

class ProblemMainTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
      rivals: props.rivals.join(" ")
    };

    this.filterAndRender = this.filterAndRender.bind(this);
    this.getTableColumns = this.getTableColumns.bind(this);
    this.columnClassNameFormatter = this.columnClassNameFormatter.bind(this);
  }

  componentDidMount() {
    MyUtils.getAPIPromise("/atcoder-api/problems", {
      user: this.state.user,
      rivals: this.state.rivals
    }).then(json => {
      this.setState({results: json});
      const solved = new Set();
      const wrong = new Set();
      const lost = new Set();
      json.forEach(p => {
        if (p.status === "AC") {
          solved.add(p.id);
        } else if (p.rivals.length > 0) {
          lost.add(p.id);
        } else {
          wrong.add(p.id);
        }
      });
      this.setState({solved: solved, wrong: wrong, lost: lost});
      MyUtils.getAPIPromise("./json/problems_simple.json", {}).then(json => this.setState({problems: json}));
      MyUtils.getAPIPromise("./json/contests.json", {}).then(json => this.setState({contests: json}));
    });
  }

  columnClassNameFormatter(value, row, rowIndex, columnIndex) {
    if (value == null)
      return "";
    if (this.state.solved.has(value.id))
      return 'success';
    if (this.state.wrong.has(value.id))
      return 'warning';
    if (this.state.lost.has(value.id))
      return 'danger';

    }

  getTableColumns(props) {
    const s = "abcdef";
    const columns = new Array(props.num).fill(0).map((_, i) => {
      const c = s.charAt(i);
      return (
        <TableHeaderColumn key={i} dataField={c} dataFormat={problemLinkFormatter} columnClassName={this.columnClassNameFormatter}>{c.toUpperCase()}
          問題</TableHeaderColumn>
      );
    });

    return (
      <Row>
        <PageHeader>
          {props.header}
        </PageHeader>
        <BootstrapTable data={props.data} striped>
          <TableHeaderColumn isKey dataField='id' dataFormat={contestLinkFormatter}>
            コンテスト
          </TableHeaderColumn>
          {columns}
        </BootstrapTable>
      </Row>
    );
  }

  filterAndRender(props) {
    if (this.state.problems == null)
      return (<Row/>);
    const contests = mergeProblems(this.state.problems, props.regex);
    const data = [];
    contests.forEach((v, k) => {
      if (v.length > 4) {
        data.push({
          id: k,
          a: v[0],
          b: v[1],
          c: v[2],
          d: v[3],
          e: v[4],
          f: v[5]
        });
      } else if (v.length > 2) {
        data.push({id: k, a: v[0], b: v[1], c: v[2], d: v[3]});
      } else {
        data.push({id: k, c: v[0], d: v[1]});
      }
    });
    data.reverse();
    return (<this.getTableColumns num={props.num} data={data} header={props.header}/>);
  }

  render() {
    const r = [/^agc[0-9]*$/, /^abc[0-9]*$/, /^arc[0-9]*$/];
    return (
      <Row>
        <this.filterAndRender regex={r[0]} num={6} header="AtCoder Grand Contest"/>
        <this.filterAndRender regex={r[1]} num={4} header="AtCoder Beginner Contest"/>
        <this.filterAndRender regex={r[2]} num={4} header="AtCoder Regular Contest"/>
      </Row>
    );
  }
}

export default ProblemMainTable;
