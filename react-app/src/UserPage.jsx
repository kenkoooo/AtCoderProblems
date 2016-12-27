import {Row, PageHeader, Col} from 'react-bootstrap';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import React, {Component} from 'react';
import PieChart from './PieChart';
import LineChart from './LineChart';
import BarChart from './BarChart';
import MyUtils from './MyUtils';

function getUniqueAcProblems(problems) {
  problems.sort((a, b) => {
    if (a.ac_time > b.ac_time) {
      return 1;
    }
    if (a.ac_time < b.ac_time) {
      return -1;
    }
    return 0;
  });
  const problemsSet = new Set();
  const uniqueList = [];
  problems.forEach(problem => {
    if (problem.status !== "AC")
      return;
    if (problemsSet.has(problem.id))
      return;
    problemsSet.add(problem.id);
    uniqueList.push(problem);
  });
  return uniqueList;
}

function getStrDate(prevDate) {
  const utcDateStr = prevDate.replace(" ", "T") + "+00:00";
  const date = new Date(utcDateStr);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dateStr = `${y}-${ ("0" + m).slice(-2)}-${ ("0" + d).slice(-2)}`;
  return dateStr;
}

function getStrDates(problems) {
  const strDates = [];
  problems.forEach(problem => {
    strDates.push(getStrDate(problem.ac_time));
  });
  strDates.sort();
  return strDates;
}

function problemFormatter(cell, row) {
  return (
    <a href={`https://${row.problem.contest}.contest.atcoder.jp/tasks/${row.problem.id}`} target="_blank">{row.problem.name}</a>
  )
}

class UserPage extends Component {
  constructor(props) {
    super(props);
    this.name = props.name;
    this.state = {
      name: this.name
    };
  }

  componentDidMount() {
    MyUtils.getAPIPromise("./json/problems_simple.json", {}).then(json => {
      const map = new Map();
      json.forEach(p => {
        if (map.has(p.id)) {
          return
        }
        map.set(p.id, p);
      });
      this.setState({problemMap: map});
    });
    MyUtils.getAPIPromise("/atcoder-api/user", {user: this.name}).then(json => this.setState({user: json}));
    MyUtils.getAPIPromise("/atcoder-api/problems", {user: this.name}).then(json => {
      this.setState({problems: getUniqueAcProblems(json)});
      this.setState({
        strDates: getStrDates(this.state.problems)
      });
    });
  }

  achievements(props) {
    const scheme = [
      {
        name: "AC 問題数",
        text: "-"
      }, {
        name: "ショートコード数",
        text: "-"
      }, {
        name: "最速コード数",
        text: "-"
      }, {
        name: "最速提出数",
        text: "-"
      }, {
        name: "最長連続 AC 日数",
        text: "-"
      }, {
        name: "現在の連続 AC 日数",
        text: "-"
      }
    ];
    if (props.state.user != null) {
      const user = props.state.user;
      scheme[0].value = `${user.ac_num} 問`;
      if (user.ac_rank > 0) {
        scheme[0].text = `${user.ac_rank} 位`;
      }

      scheme[1].value = `${user.short_num} 問`;
      if (user.short_rank > 0) {
        scheme[1].text = `${user.short_rank} 位`;
      }

      scheme[2].value = `${user.fast_num} 問`;
      if (user.fast_rank > 0) {
        scheme[2].text = `${user.fast_rank} 位`;
      }

      scheme[3].value = `${user.first_num} 問`;
      if (user.first_rank > 0) {
        scheme[3].text = `${user.first_rank} 位`;
      }
    }

    if (props.state.strDates != null) {
      const strDates = props.state.strDates;

      let consecutiveAc = 1;
      let max = 0;
      const dates = [new Date(strDates[0])];
      for (let i = 1; i < strDates.length; i++) {
        const day = new Date(strDates[i]);
        const prev = new Date(strDates[i - 1]);
        if (day.getTime() === prev.getTime()) {
          continue;
        }
        dates.push(day);

        prev.setDate(prev.getDate() + 1);
        if (day.getTime() === prev.getTime()) {
          consecutiveAc++;
        } else {
          max = Math.max(max, consecutiveAc);
          consecutiveAc = 1;
        }
      }
      max = Math.max(max, consecutiveAc);

      scheme[4].value = `${max} 日`;

      const yesterday = new Date();
      yesterday.setSeconds(0);
      yesterday.setMinutes(0);
      yesterday.setHours(0);

      const lastDate = dates[dates.length - 1];
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate.getTime() >= yesterday.getTime()) {
        scheme[5].value = `${consecutiveAc} 日`;
      } else {
        scheme[5].value = "0 日";
      }
      scheme[5].text = `Last AC: ${strDates[strDates.length - 1]}`;
    }

    const columns = [];
    scheme.forEach(s => {
      columns.push(
        <Col key={s.name} xs={6} sm={3}>
          <h4>{s.name}</h4>
          <h3>{s.value}</h3>
          <span className="text-muted">{s.text}</span>
        </Col>
      );
    });

    return (
      <Row className="placeholders">
        {columns}
      </Row>
    );
  }

  pieCharts(props) {
    return (<PieChart name={props.name} ac={props.ac} total={props.total} title={props.title}/>);
  }

  lineChart(props) {
    const ticks = ["x"];
    const data = ["Accepted"];
    const strDates = props.strDates;
    if (strDates == null) {
      return (
        <div></div>
      );
    }

    strDates.forEach((v, i) => {
      if (i > 0 && strDates[i] === strDates[i - 1]) {
        return;
      }
      ticks.push(strDates[i]);
      data.push(i + 1);
    });
    return (<LineChart name="Climbing" ticks={ticks} data={data}/>);
  }

  barChart(props) {
    const ticks = ["x"];
    const data = ["Accepted"];
    const strDates = props.strDates;
    if (strDates == null) {
      return (
        <div></div>
      );
    }
    for (let i = 0; i < strDates.length; i++) {
      if (i > 0 && strDates[i] === strDates[i - 1]) {
        continue;
      }
      ticks.push(strDates[i]);
      data.push(i + 1);
    }

    for (let i = data.length - 1; i > 1; i--) {
      data[i] -= data[i - 1];
    }
    return (<BarChart name="effort" ticks={ticks} data={data}/>);
  }

  render() {
    if (this.state.problems == null || this.state.problems.length === 0 || this.state.problemMap == null) {
      return (
        <Row></Row>
      );
    }

    const records = [];
    this.state.problems.forEach(p => {
      if (p.status !== "AC") {
        return;
      }
      p.problem = this.state.problemMap.get(p.id);
      records.push(p);
    });
    records.sort((a, b) => {
      if (a.ac_time > b.ac_time) {
        return -1;
      }
      if (a.ac_time < b.ac_time) {
        return 1;
      }
      return 0;
    })

    const user = this.state.user;
    return (
      <Row>
        <PageHeader>
          {this.name}
        </PageHeader>
        <Row>
          <this.achievements state={this.state}/>
        </Row>

        <PageHeader>
          AtCoder Beginner Contest
        </PageHeader>
        <Row>
          <this.pieCharts name="abc_a" ac={user.abc_a} total={user.abc_num} title="A 問題"/>
          <this.pieCharts name="abc_b" ac={user.abc_b} total={user.abc_num} title="B 問題"/>
          <this.pieCharts name="abc_c" ac={user.abc_c} total={user.abc_num} title="C 問題"/>
          <this.pieCharts name="abc_d" ac={user.abc_d} total={user.abc_num} title="D 問題"/>
        </Row>

        <PageHeader>
          AtCoder Regular Contest
        </PageHeader>
        <Row>
          <this.pieCharts name="arc_a" ac={user.arc_a} total={57} title="A 問題"/>
          <this.pieCharts name="arc_b" ac={user.arc_b} total={57} title="B 問題"/>
          <this.pieCharts name="arc_c" ac={user.arc_c} total={user.arc_num} title="C 問題"/>
          <this.pieCharts name="arc_d" ac={user.arc_d} total={user.arc_num} title="D 問題"/>
        </Row>

        <PageHeader>
          Climbing
        </PageHeader>
        <Row>
          <this.lineChart strDates={this.state.strDates}/>
        </Row>

        <PageHeader>
          Daily Effort
        </PageHeader>
        <Row>
          <this.barChart strDates={this.state.strDates}/>
        </Row>

        <PageHeader>
          Records
        </PageHeader>
        <Row>
          <BootstrapTable data={records} striped>
            <TableHeaderColumn dataField="ac_time">Date</TableHeaderColumn>
            <TableHeaderColumn dataField="problem" isKey dataFormat={problemFormatter}>Problem</TableHeaderColumn>
          </BootstrapTable>
        </Row>
      </Row>
    );
  }
}

export default UserPage;
