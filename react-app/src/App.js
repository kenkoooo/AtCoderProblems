import React, {Component} from 'react';
import queryString from 'query-string';
import logo from './logo.svg';
import './App.css';

class App extends Component {
    render() {
        console.log(queryString.parse(location.search));
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
}

export default App;
