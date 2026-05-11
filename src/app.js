import express from 'express';
import compression from 'compression';
import cors from 'cors';
import client from 'prom-client';
import crypto from 'crypto';

const app = express();

/**
 * IMPORTANT
 * GoToWebinar signature verification requires the RAW request body.
 * This MUST come before any JSON/body parsing.
 */
app.use(express.raw({ type: '*/*' }));

app.use(compression({ enforceEncoding: 'gzip' }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : [],
  }),
);

// Prometheus metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

/**
 * Default health/root endpoint
 */
app.get('/', (req, res) => {
  res.send('Hello World!');
});

/**
 * GoToWebinar webhook endpoint
 * POST /webhooks/goto/registrant
 */
app.post('/webhooks/goto/registrant', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-signature-timestamp'];

    if (!signature || !timestamp) {
      return res.status(400).send('Missing webhook headers');
    }

    const rawBody = req.body.toString();
    const signedPayload = `${timestamp}:${rawBody}`;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.G2W_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('base64');

    if (expectedSignature !== signature) {
      return res.status(401).send('Invalid signature');
    }

    // ✅ Signature verified
    const payload = JSON.parse(rawBody);
    console.log('✅ GoToWebinar webhook verified');
    console.log(payload);

    // TODO (next step): Salesforce Lead creation

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

export default app;
