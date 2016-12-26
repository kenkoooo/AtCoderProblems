import {
  FormGroup,
  FormControl,
  Button,
  ControlLabel,
  Row,
  Form,
  PageHeader,
  Col
} from 'react-bootstrap';
import React, {Component} from 'react';
import request from 'superagent';

function getAPIPromise(url, name) {
  return new Promise((resolve, reject) => {
    request.get(url).query({user: name}).end((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(res.text));
      }
    });
  });
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
    getAPIPromise("user", this.name).then(json => this.setState({user: json}));
    getAPIPromise("problems", this.name).then(json => this.setState({problems: json}));
  }

  achievements(props) {
    const scheme = [
      {
        name: "AC 問題数",
        value: "1e9+7 問",
        text: "-"
      }, {
        name: "ショートコード数",
        value: "1e9+7 問",
        text: "-"
      }, {
        name: "最速コード数",
        value: "1e9+7 問",
        text: "-"
      }, {
        name: "最速提出数",
        value: "1e9+7 問",
        text: "-"
      }, {
        name: "最長連続 AC 日数",
        value: "1e9+7 日",
        text: "-"
      }, {
        name: "現在の連続 AC 日数",
        value: "1e9+7 日",
        text: "-"
      }
    ];
    if (props.state.user != null) {
      const user = props.state.user;
      console.log(user);
      scheme[0].value = `${user.ac_num} 問`;
      if (user.ac_rank > 0)
        scheme[0].text = `${user.ac_rank} 位`;

      scheme[1].value = `${user.short_num} 問`;
      if (user.short_rank > 0)
        scheme[1].text = `${user.short_rank} 位`;

      scheme[2].value = `${user.fast_num} 問`;
      if (user.fast_rank > 0)
        scheme[2].text = `${user.fast_rank} 位`;

      scheme[3].value = `${user.first_num} 問`;
      if (user.first_rank > 0) 
        scheme[3].text = `${user.first_rank} 位`;
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

  render() {
    return (
      <Row>
        <PageHeader>
          {this.name}
        </PageHeader>
        <this.achievements state={this.state}/>
      </Row>
    );
  }
}

export default UserPage;
