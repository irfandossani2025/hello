import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout(props) {
  var _open = useState(false);
  var open = _open[0];
  var setOpen = _open[1];

  return React.createElement('div', { className: 'layout' },
    React.createElement(Sidebar, {
      open: open,
      onClose: function() { setOpen(false); }
    }),
    React.createElement('div', { className: 'main-content' },
      React.createElement(Navbar, {
        onMenuClick: function() { setOpen(true); }
      }),
      React.createElement('main', { className: 'page-content' },
        props.children
      )
    )
  );
}

export default Layout;
