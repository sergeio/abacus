import React from 'react';

import {
    BrowserRouter as Router,
    Route,
} from "react-router-dom";

import './App.css';

import Dashboard from './Dashboard';
import Navigation from './Navigation';
import EventSummary from './EventSummary';
import Funnels from './Funnels';

import './client/inject';

function Layout(props) {
    return (
        <Navigation {...props}>
            {props.children}
        </Navigation>
    );
}


function App(props) {
    return (
        <div className="App">
            <Router>
                <Route exact path="/" render={() => (
                    <Layout {...props} title="Dashboard"><Dashboard /></Layout>
                )} />
                <Route exact path="/dashboard" render={() => (
                    <Layout {...props} title="Dashboard"><Dashboard /></Layout>
                )} />
                <Route exact path="/events" render={() => (
                    <Layout {...props} title="Events"><EventSummary /></Layout>
                )} />
                <Route exact path="/funnels" render={() => (
                    <Layout {...props} title="Funnels"><Funnels /></Layout>
                )} />
            </Router>
        </div>
    );
}

export default App;
