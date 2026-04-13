'use strict';

require('dotenv').config();

var express = require('express');
var cors = require('cors');
var morgan = require('morgan');
var path = require('path');

var db = require('./src/config/database');
// Import models to register associations
require('./src/models/index');

var routes = require('./src/routes/index');
var whatsappRoutes = require('./src/routes/whatsapp');
var errorHandler = require('./src/middleware/errorHandler');

var app = express();
var PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// API Routes
app.use('/api', routes);

// WhatsApp Webhook
app.use('/webhook', whatsappRoutes);

// Serve React frontend build
var frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuild));

// SPA fallback - serve index.html for all non-API routes
app.get('*', function(req, res) {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

// Connect DB and start server
db.authenticate()
  .then(function() {
    console.log('Database connected successfully');
    return db.sync({ alter: false });
  })
  .then(function() {
    console.log('Database synced');
    app.listen(PORT, function() {
      console.log('Server running on port ' + PORT);
      console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
    });
  })
  .catch(function(err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });

module.exports = app;
