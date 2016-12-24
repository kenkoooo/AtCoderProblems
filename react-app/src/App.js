import React, {Component} from 'react';
import Arguments from './Arguments';
import logo from './logo.svg';
import './App.css';

function hoge() {
  return (
    <div className="App">
      <div className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <h2>Welcome to Hoge!!</h2>
      </div>
      <p className="App-intro">
        To get started, edit
        <code>src/App.js</code>
        and save to reload.
      </p>
    </div>
  );
}

class App extends Component {
  render() {
    const args = new Arguments();
    console.log(args);
    return hoge();
  }
}

export default App;
