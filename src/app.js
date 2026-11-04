const fs = require('fs');
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const routes = require('./routes');

const SWAGGER_PATH = path.join(__dirname, '..', 'docs', 'swagger.yaml');
const swaggerDocument = YAML.parse(fs.readFileSync(SWAGGER_PATH, 'utf8'));

const app = express();
app.use(express.json());

// API specification: raw YAML + rendered Swagger UI
app.get('/api-docs/swagger.yaml', (req, res) => res.type('text/yaml').sendFile(SWAGGER_PATH));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.redirect('/api-docs'));

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
