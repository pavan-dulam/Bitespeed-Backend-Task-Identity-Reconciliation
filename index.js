const express = require('express');
const env = require('dotenv');
env.config({ path: './.env' });
const routes = require('./routes/routes');
const errorHandler = require('./middleware/errorHandler');
const SERVICE_PORT = process.env.SERVICE_PORT;
const app = express();

app.use(routes);
app.use(errorHandler);

app.listen(SERVICE_PORT, () => {
  console.log(`Server is running on port ${SERVICE_PORT}.`);
});
