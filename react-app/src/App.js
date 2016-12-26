import {Grid} from 'react-bootstrap';
import React, {Component} from 'react';
import Arguments from './Arguments';
import UserSearch from './UserSearch';
import UserPage from './UserPage';
import HeadBox from './HeadBox';
import './App.css';

class App extends Component {
  render() {
    const args = new Arguments();

    if (args.isUserPage()) {
      return (
        <Grid>
          <UserSearch name={args.name}/>
          <UserPage name={args.name}/>
        </Grid>
      );
    }

    return (
      <Grid>
        <HeadBox name={args.name} rivals={args.rivals} kind={args.kind}></HeadBox>
      </Grid>
    );
  }
}

export default App;
