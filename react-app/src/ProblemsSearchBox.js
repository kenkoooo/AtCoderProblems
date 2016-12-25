import React, {Component} from 'react';
import {FormGroup, FormControl, Button} from 'react-bootstrap';

class ProblemsSearchBox extends Component {
  render() {
    return (
      <form action="./" method="get">
        <FormGroup>
          <label>
            User ID:
          </label>
          <FormControl type="text" placeholder="User ID" name="name" value="kenkoooo"/>
          <FormControl type="hidden" name="kind" value="user"/>
        </FormGroup>
        <Button type="submit">Search</Button>
      </form>
    );
  }
}

export default ProblemsSearchBox;
