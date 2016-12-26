import {
  FormGroup,
  FormControl,
  Button,
  ControlLabel,
  Row,
  Form
} from 'react-bootstrap';
import React, {Component} from 'react';

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
    );
  }
}

export default UserSearch;
