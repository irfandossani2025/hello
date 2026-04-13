import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calls from './pages/Calls';
import Leads from './pages/Leads';
import Quotations from './pages/Quotations';
import Products from './pages/Products';

function PrivateRoute(props) {
  var children = props.children;
  var rest = Object.assign({}, props);
  delete rest.children;

  var auth = useAuth();

  if (auth.loading) {
    return React.createElement('div', { className: 'loading-screen' },
      React.createElement('span', { className: 'spinner' })
    );
  }

  return React.createElement(Route, rest, function(routeProps) {
    if (auth.user) {
      return children;
    }
    return React.createElement(Redirect, {
      to: { pathname: '/login', state: { from: routeProps.location } }
    });
  });
}

function AppRoutes() {
  var auth = useAuth();

  return React.createElement(Switch, null,
    React.createElement(Route, { path: '/login' },
      auth.user
        ? React.createElement(Redirect, { to: '/' })
        : React.createElement(Login)
    ),
    React.createElement(PrivateRoute, { path: '/', exact: true },
      React.createElement(Layout, null, React.createElement(Dashboard))
    ),
    React.createElement(PrivateRoute, { path: '/calls' },
      React.createElement(Layout, null, React.createElement(Calls))
    ),
    React.createElement(PrivateRoute, { path: '/leads' },
      React.createElement(Layout, null, React.createElement(Leads))
    ),
    React.createElement(PrivateRoute, { path: '/quotations' },
      React.createElement(Layout, null, React.createElement(Quotations))
    ),
    React.createElement(PrivateRoute, { path: '/products' },
      React.createElement(Layout, null, React.createElement(Products))
    ),
    React.createElement(Redirect, { to: '/' })
  );
}

function App() {
  return React.createElement(AuthProvider, null,
    React.createElement(Router, null,
      React.createElement(AppRoutes)
    )
  );
}

export default App;
