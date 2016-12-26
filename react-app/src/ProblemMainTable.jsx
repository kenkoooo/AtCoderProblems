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

class ProblemMainTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
      rivals: props.rivals
    };
  }

  componentDidMount() {
    MyUtils.getAPIPromise("./json/problems_simple.json", {}).then(json => this.setState({problems: json}));
    MyUtils.getAPIPromise("./json/contests.json", {}).then(json => this.setState({contests: json}));
    MyUtils.getAPIPromise("/atcoder-api/problems", {
      user: this.state.user,
      rivals: this.state.rivals
    }).then(json => this.setState({results: json}));
  }

  render() {
    const contests = new Map();
    if (this.state.problems != null)
      this.state.problems.forEach(problem => {
        const contest = problem.contest;
        if (contest.match(/^[agc[0-9]*$/)) {
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
    console.log(contests);

    return (
      <Row>
        <PageHeader>
          AtCoder Grand Contest
        </PageHeader>
        <BootstrapTable data={[]} striped>
          <TableHeaderColumn isKey dataField='id'>Product ID</TableHeaderColumn>
          <TableHeaderColumn dataField='name'>Product Name</TableHeaderColumn>
          <TableHeaderColumn dataField='price'>Product Price</TableHeaderColumn>
        </BootstrapTable>
      </Row>
    );
  }
}

export default ProblemMainTable;
