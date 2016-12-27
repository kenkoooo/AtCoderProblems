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
  return (
    <a href={`https://${row.id}.contest.atcoder.jp/tasks/${cell.id}`} target="_blank">{cell.name}</a>
  );
}

function contestLinkFormatter(cell, row) {
  return (
    <a href={`https://${row.id}.contest.atcoder.jp/`} target="_blank">{cell.toUpperCase()}</a>
  );
}

class ProblemMainTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
      rivals: props.rivals.join(" ")
    };

    this.filterAndRender = this.filterAndRender.bind(this);
  }

  componentDidMount() {
    MyUtils.getAPIPromise("./json/problems_simple.json", {}).then(json => this.setState({problems: json}));
    MyUtils.getAPIPromise("./json/contests.json", {}).then(json => this.setState({contests: json}));
    MyUtils.getAPIPromise("/atcoder-api/problems", {
      user: this.state.user,
      rivals: this.state.rivals
    }).then(json => this.setState({results: json}));
  }

  getTableColumns(props) {
    const s = "abcdef";
    const columns = new Array(props.num).fill(0).map((_, i) => {
      const c = s.charAt(i);
      return (
        <TableHeaderColumn key={i} dataField={c} dataFormat={problemLinkFormatter}>{c.toUpperCase()}
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
    const contests = new Map();
    if (this.state.problems != null)
      this.state.problems.forEach(problem => {
        const contest = problem.contest;
        if (contest.match(props.regex)) {
          if (!contests.has(contest)) {
            contests.set(contest, []);
          }
          contests.get(contest).push({id: problem.id, name: problem.name});
        }
      });
    const data = [];
    contests.forEach((v, k) => {
      v.sort((a, b) => {
        if (a.id > b.id)
          return 1;
        if (a.id < b.id)
          return -1;
        return 0;
      });
      const o = {
        id: k,
        a: v[0],
        b: v[1],
        c: v[2],
        d: v[3]
      };
      if (v.length > 4) {
        o.e = v[4];
        o.f = v[5];
      }
      data.push(o);
    });

    return (<this.getTableColumns num={props.num} data={data} header={props.header}/>);
  }

  render() {
    const regex = /^[agc[0-9]*$/;
    return (<this.filterAndRender regex={regex} num={6} header="AtCoder Grand Contest"/>);
  }
}

export default ProblemMainTable;
