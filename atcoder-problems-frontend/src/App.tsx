import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch, Redirect, RouteComponentProps } from 'react-router-dom';
import { Container } from 'reactstrap';

import ACRanking from './pages/ACRanking';
import FastestRanking from './pages/FastestRanking';
import FirstRanking from './pages/FirstRanking';
import ShortRanking from './pages/ShortRanking';
import SumRanking from './pages/SumRanking';
import LanguageOwners from './pages/LanguageOwners';
import ListPage from './pages/ListPage';
import UserPage from './pages/UserPage';
import TablePage from './pages/TablePage';

import NavigationBar from './components/NavigationBar';
type MatchUserId = { match: { params: { user_id?: string } } };
const extractUserId = ({ match: { params: { user_id } } }: MatchUserId) => (user_id ? user_id.split('/') : []);

class App extends Component {
	render() {
		return (
			<Router>
				<div>
					<NavigationBar />
					<Container style={{ width: '100%', maxWidth: '90%' }}>
						<Switch>
							<Route exact path="/ac" component={ACRanking} />
							<Route exact path="/fast" component={FastestRanking} />
							<Route exact path="/short" component={ShortRanking} />
							<Route exact path="/first" component={FirstRanking} />
							<Route exact path="/sum" component={SumRanking} />
							<Route exact path="/lang" component={LanguageOwners} />
							<Route
								path="/user/:user_id([a-zA-Z0-9]*)*"
								component={(props: MatchUserId) => <UserPage user_ids={extractUserId(props)} />}
							/>
							<Route
								path="/table/:user_id([a-zA-Z0-9]*)*"
								component={(props: MatchUserId) => <TablePage user_ids={extractUserId(props)} />}
							/>
							<Route
								path="/list/:user_id([a-zA-Z0-9]*)*"
								component={(props: MatchUserId) => <ListPage user_ids={extractUserId(props)} />}
							/>

							<Redirect path="/" to="/table" />
						</Switch>
					</Container>
				</div>
			</Router>
		);
	}
}

export default App;
