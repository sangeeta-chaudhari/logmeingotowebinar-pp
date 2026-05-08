import express from 'express';
import compression from 'compression';
import cors from 'cors';
import client from 'prom-client';

const app = express();

app.use(compression({ enforceEncoding: 'gzip' }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],
  }),
);

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
