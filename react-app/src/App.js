import React, {Component} from 'react';
import Arguments from './Arguments';
import {
  FormGroup,
  FormControl,
  Button,
  ControlLabel,
  Row,
  Grid,
  Form
} from 'react-bootstrap';
import './App.css';

class UserSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.name
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <Grid>
        <Row>
          <Form action="./" method="get" inline>
            <FormGroup>
              <ControlLabel>User ID:</ControlLabel>
              <FormControl type="text" name="name" value={this.state.value} onChange={this.handleChange}/>
              <FormControl type="hidden" name="kind" value="user"/>
            </FormGroup>
            <Button type="submit">Search</Button>
          </Form>
        </Row>
      </Grid>
    );
  }
}

class App extends Component {
  render() {
    const args = new Arguments();
    const name = args.name != null
      ? args.name
      : "";
    return (
      <div><UserSearch name={name}/></div>
    );
  }
}

export default App;
