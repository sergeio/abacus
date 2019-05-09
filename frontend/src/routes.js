import React from 'react';

import {
    BrowserRouter as Router,
    Route,
} from "react-router-dom";

import Dashboard from './Dashboard';
import Events from './Events';

function AppRouter(props) {
    return (
        <Router>
            {props.children}
            <Route exact path="/" component={Dashboard} />
            <Route path="/events" component={Events} />
        </Router>
    );
}

export default AppRouter;
