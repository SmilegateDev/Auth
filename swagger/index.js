const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const express = require('express')

const router = express.Router();

var swaggerDefinition = {
    info: { // API informations (required)
      title: 'Hello World', // Title (required)
      version: '1.0.0', // Version (required)
      description: 'A sample API', // Description (optional)
    },
    host: 'localhost:8002', // Host (optional)
    basePath: '/', // Base path (optional)
  }
  
  // Options for the swagger docs
  var options = {
    // Import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // Path to the API docs
    apis: ['./routes/auth.js'],
  }
  
  // Initialize swagger-jsdoc -> returns validated swagger spec in json format
  var swaggerSpec = swaggerJSDoc(options);

  router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


  module.exports = router