import app from './app.js';
import express from 'express';
import client from 'prom-client';

const port = process.env.PORT || 8080;
const metricsPort = process.env.METRICS_PORT || 44420;

// Main application server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// Separate server for health checks and metrics (internal only)
const metricsApp = express();

metricsApp.get('/health', (req, res) => {
  res.status(200).send('OK');
});

metricsApp.get('/prometheus', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    console.error('Error generating Prometheus metrics', ex);
    res.status(500).end('Internal Server Error');
  }
});

metricsApp.listen(metricsPort, () => {
  console.log(`Metrics and health listening on port ${metricsPort}`);
});
