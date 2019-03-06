import React, { Component } from 'react';
import { HashRouter, Route, Link } from "react-router-dom";

function Home() {
  return (<p>a</p>);
}
function Work() {
  return (<p>b</p>);
}

class App extends Component {
  render() {
    return (
      <HashRouter>
        <div>
          <Route exact path="/" component={Home} />
          <Route path="/b" component={Work} />
        </div>
      </HashRouter>
    );
  }
}

export default App;
