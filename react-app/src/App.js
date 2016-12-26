import {Grid} from 'react-bootstrap';
import React, {Component} from 'react';
import Arguments from './Arguments';
import UserSearch from './UserSearch';
import UserPage from './UserPage';
import './App.css';

class App extends Component {
  render() {
    const args = new Arguments();
    const name = args.name != null
      ? args.name
      : "";

    return (
      <Grid>
        <UserSearch name={name}/>
        <UserPage name={name}/>
      </Grid>
    );
  }
}

export default App;
