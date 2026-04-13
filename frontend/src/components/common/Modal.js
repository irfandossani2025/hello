import React, { useEffect } from 'react';

function Modal(props) {
  var title = props.title;
  var onClose = props.onClose;
  var children = props.children;
  var footer = props.footer;
  var size = props.size || '';

  useEffect(function() {
    function handler(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return function() { document.removeEventListener('keydown', handler); };
  }, [onClose]);

  return React.createElement('div', {
    className: 'modal-backdrop',
    onClick: function(e) { if (e.target === e.currentTarget) onClose(); }
  },
    React.createElement('div', { className: 'modal' + (size ? ' modal-' + size : '') },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('span', { className: 'modal-title' }, title),
        React.createElement('button', { className: 'modal-close', onClick: onClose }, '✕')
      ),
      React.createElement('div', { className: 'modal-body' }, children),
      footer && React.createElement('div', { className: 'modal-footer' }, footer)
    )
  );
}

export default Modal;
