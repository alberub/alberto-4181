import express, { type ErrorRequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import {
  paymentRequestSchema,
  testCards,
  type PaymentResponse,
} from '../../../packages/contracts/src/index.js';

type Options = { systemError?: boolean; timeoutMs?: number };
export function createApp(options: Options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  // Small, process-local mock idempotency cache. Durable version belongs in PostgreSQL.
  const operations = new Map<
    string,
    { fingerprint: string; code: number; body: PaymentResponse }
  >();
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: 'simulation' }));
  app.post('/api/snailpay/payments', async (req, res) => {
    const raw = req.body && typeof req.body === 'object' ? req.body : {};
    const base: PaymentResponse = {
      id: randomUUID(),
      status: 'error',
      status_detail: 'invalid_data',
      transaction_amount:
        typeof raw.transaction_amount === 'number' &&
        Number.isFinite(raw.transaction_amount) &&
        raw.transaction_amount > 0
          ? raw.transaction_amount
          : 0,
      date_created: new Date().toISOString(),
      authorization_code: null,
      reference: typeof raw.reference === 'string' ? raw.reference.slice(0, 100) : '',
      payer_id: typeof raw.payer_id === 'string' ? raw.payer_id.slice(0, 100) : '',
      payer_email: typeof raw.payer_email === 'string' ? raw.payer_email.slice(0, 254) : '',
      card_number: [testCards.approved.card_number, testCards.declined.card_number].includes(
        raw.card_number,
      )
        ? raw.card_number
        : null,
      cvv: [testCards.approved.cvv, testCards.declined.cvv].includes(raw.cvv) ? raw.cvv : null,
    };
    // Global failure takes precedence over cached approvals.
    if (
      options.systemError ||
      process.env.SNAILPAY_MODE === 'system_error' ||
      raw.scenario === 'system_error'
    ) {
      return res.status(503).json({ ...base, status_detail: 'service_unavailable' });
    }
    const parsed = paymentRequestSchema.safeParse(raw);
    if (!parsed.success) return res.status(400).json({ ...base, status: 'rejected' });
    const input = parsed.data;
    if (input.scenario === 'timeout') {
      await new Promise((resolve) => setTimeout(resolve, options.timeoutMs ?? 6000));
      // A delayed scenario never approves, even if the client has disconnected.
      return res.status(504).json({ ...base, status_detail: 'gateway_timeout' });
    }
    const key = `${input.payer_id}:${input.reference}`;
    const fingerprint = JSON.stringify(input);
    const existing = operations.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint)
        return res.status(409).json({ ...base, status_detail: 'reference_conflict' });
      return res.status(existing.code).json(existing.body);
    }
    const approved =
      input.card_number === testCards.approved.card_number &&
      input.cvv === testCards.approved.cvv &&
      input.expiration === testCards.approved.expiration;
    const body: PaymentResponse = {
      ...base,
      status: approved ? 'approved' : 'rejected',
      status_detail: approved ? 'accredited' : 'card_declined',
      authorization_code: approved ? `SIM-${randomUUID().slice(0, 8).toUpperCase()}` : null,
    };
    const code = approved ? 200 : 422;
    if (operations.size >= 1000) operations.delete(operations.keys().next().value!);
    operations.set(key, { fingerprint, code, body });
    return res.status(code).json(body);
  });
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    // Never log request bodies (they contain credentials and mock card fields).
    const code = error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    res.status(code).json({
      id: randomUUID(),
      status: 'error',
      status_detail: code === 500 ? 'internal_error' : 'invalid_request',
      transaction_amount: 0,
      date_created: new Date().toISOString(),
      authorization_code: null,
      reference: '',
      payer_id: '',
      payer_email: '',
      card_number: null,
      cvv: null,
    } satisfies PaymentResponse);
  };
  app.use(errorHandler);
  return app;
}
