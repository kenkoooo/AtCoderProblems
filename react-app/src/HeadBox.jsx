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

class HeadBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.name,
      rivals: props.rivals,
      kind: props.kind,
      trying: props.trying
    };

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleRadio = this.handleRadio.bind(this);
    this.handleRivalsChange = this.handleRivalsChange.bind(this);
    this.onlyAc = this.onlyAc.bind(this);
  }

  handleNameChange(event) {
    this.setState({value: event.target.value});
  }
  handleRivalsChange(event) {
    this.setState({rivals: event.target.value});
  }
  handleRadio(event) {
    this.setState({kind: event.target.value});
  }
  handleTrying(event) {
    this.setState({
      trying: !this.state.trying
    });
  }

  onlyAc() {
    if (this.state.kind === "list") {
      return (
        <FormGroup>
          <Checkbox name="trying" value="1" checked={this.state.trying} onChange={e => this.setState({
            trying: !this.state.trying
          })}>
            AC していない問題のみ表示
          </Checkbox>
        </FormGroup>
      );
    }
    return (
      <div></div>
    );
  }

  render() {
    return (
      <Row>
        <PageHeader>
          AtCoder Problems
        </PageHeader>

        <p className="lead">
          <a href="http://atcoder.jp/">AtCoder
          </a>
          の非公式過去問集です。User ID から AC した問題を検索できます。
        </p>
        <Form action="./" method="get" inline>
          <FormGroup>
            <ControlLabel>User ID:</ControlLabel>
            <FormControl type="text" name="name" value={this.state.value} onChange={this.handleNameChange} placeholder="User ID"/>
          </FormGroup>

          <FormGroup>
            <ControlLabel>ライバル:</ControlLabel>
            <FormControl type="text" name="rivals" value={this.state.rivals} onChange={this.handleRivalsChange} placeholder="User ID,User ID,User ID,..."/>
          </FormGroup>

          <FormGroup>
            <Radio name="kind" value="index" onChange={this.handleRadio} checked={this.state.kind === "index"}>
              カテゴリ表示
            </Radio>
            {' '}
            <Radio name="kind" value="list" onChange={this.handleRadio} checked={this.state.kind === "list"}>
              リスト表示
            </Radio>
            {' '}
            <Radio name="kind" value="battle" onChange={this.handleRadio} checked={this.state.kind === "battle"}>
              バトル
            </Radio>
            {' '}
            <Radio name="kind" value="practice" onChange={this.handleRadio} checked={this.state.kind === "practice"}>
              練習
            </Radio>
            {' '}
          </FormGroup>
          <Button type="submit">Search</Button>
          <this.onlyAc/>
        </Form>
      </Row>
    );
  }
}

export default HeadBox;
