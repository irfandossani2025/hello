'use strict';

function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  var status = err.status || err.statusCode || 500;
  var message = err.message || 'Internal server error';

  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = err.errors.map(function(e) { return e.message; }).join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 400;
    message = 'A record with this value already exists';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 400;
    message = 'Referenced record does not exist';
  } else if (status === 500) {
    message = 'Internal server error';
  }

  res.status(status).json({
    success: false,
    message: message
  });
}

module.exports = errorHandler;
