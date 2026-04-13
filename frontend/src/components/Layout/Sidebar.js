import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

var NAV_ITEMS = [
  { to: '/', exact: true, label: 'Dashboard', icon: '⊞' },
  { to: '/calls', label: 'Calls', icon: '☎' },
  { to: '/leads', label: 'Leads', icon: '◈' },
  { to: '/quotations', label: 'Quotations', icon: '◫' },
  { to: '/products', label: 'Products', icon: '⬡' }
];

function Sidebar(props) {
  var auth = useAuth();
  var user = auth.user || {};
  var initials = user.name ? user.name.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase() : 'U';

  return React.createElement(React.Fragment, null,
    // Overlay
    React.createElement('div', {
      className: 'sidebar-overlay' + (props.open ? ' open' : ''),
      onClick: props.onClose
    }),

    // Sidebar
    React.createElement('aside', { className: 'sidebar' + (props.open ? ' open' : '') },

      // Logo
      React.createElement('div', { className: 'sidebar-logo' },
        React.createElement('span', { className: 'sidebar-logo-text' }, 'Gifting CRM'),
        React.createElement('span', { className: 'sidebar-logo-sub' }, 'Corporate Gifting')
      ),

      // Navigation
      React.createElement('nav', { className: 'sidebar-nav' },
        React.createElement('div', { className: 'nav-section-title' }, 'Main Menu'),
        NAV_ITEMS.map(function(item) {
          return React.createElement(NavLink, {
            key: item.to,
            to: item.to,
            exact: item.exact || false,
            className: 'nav-item',
            activeClassName: 'active',
            onClick: props.onClose
          },
            React.createElement('span', { style: { fontSize: '16px', lineHeight: 1 } }, item.icon),
            React.createElement('span', null, item.label)
          );
        })
      ),

      // Footer / User info
      React.createElement('div', { className: 'sidebar-footer' },
        React.createElement('div', { className: 'sidebar-user' },
          React.createElement('div', { className: 'sidebar-avatar' }, initials),
          React.createElement('div', { className: 'sidebar-user-info' },
            React.createElement('div', { className: 'sidebar-user-name' }, user.name || 'User'),
            React.createElement('div', { className: 'sidebar-user-role' }, user.role || 'sales')
          ),
          React.createElement('button', {
            className: 'sidebar-logout',
            onClick: auth.logout,
            title: 'Logout'
          }, '⏻')
        )
      )
    )
  );
}

export default Sidebar;
