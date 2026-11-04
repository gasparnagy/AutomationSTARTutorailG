const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`E-commerce Checkout API running at http://localhost:${PORT}`);
  console.log(`Swagger UI:        http://localhost:${PORT}/api-docs`);
  console.log(`Swagger YAML:      http://localhost:${PORT}/api-docs/swagger.yaml`);
});
