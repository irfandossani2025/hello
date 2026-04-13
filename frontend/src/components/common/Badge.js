import React from 'react';

var STATUS_COLORS = {
  // Call statuses
  pending:    'yellow',
  completed:  'green',
  follow_up:  'blue',
  no_answer:  'gray',
  // Lead statuses
  new:        'blue',
  contacted:  'yellow',
  qualified:  'purple',
  unqualified:'red',
  converted:  'green',
  // Quotation statuses
  draft:      'gray',
  sent:       'blue',
  won:        'green',
  lost:       'red',
  // Source
  call:       'blue',
  whatsapp:   'green',
  direct:     'gray',
  referral:   'purple',
  other:      'gray',
  // General
  active:     'green',
  inactive:   'red',
  admin:      'purple',
  sales:      'blue'
};

function Badge(props) {
  var value = props.value || '';
  var label = props.label || (value.replace(/_/g, ' '));
  var color = STATUS_COLORS[value] || 'gray';

  return React.createElement('span', {
    className: 'badge badge-' + color
  }, label);
}

export default Badge;
