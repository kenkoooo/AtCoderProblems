import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/main.jsx';

ReactDOM.render(
  <Main message='and GoodBye World' date={new Date()}/>,
  document.getElementById('app')
);
