import React from 'react';
import ReactDOM from 'react-dom';
import NavigationBar from './NavigationBar';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <NavigationBar/>, div);
});
