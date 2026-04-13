import React from 'react';
import { useLocation } from 'react-router-dom';

var TITLES = {
  '/': 'Dashboard',
  '/calls': 'Call Logs',
  '/leads': 'Leads',
  '/quotations': 'Quotations',
  '/products': 'Product Catalog'
};

function Navbar(props) {
  var location = useLocation();
  var title = TITLES[location.pathname] || 'Gifting CRM';

  return React.createElement('header', { className: 'navbar' },
    React.createElement('button', {
      className: 'navbar-menu-btn',
      onClick: props.onMenuClick,
      'aria-label': 'Open menu'
    }, '☰'),
    React.createElement('span', { className: 'navbar-title' }, title),
    React.createElement('div', { className: 'navbar-right' },
      React.createElement('span', null, new Date().toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' }))
    )
  );
}

export default Navbar;
