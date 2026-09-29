import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from './app';
import { paymentResponseSchema, testCards } from '../../../packages/contracts/src/index';
const input = () => ({
  ...testCards.approved,
  cardholder_name: 'Usuario Demo',
  transaction_amount: 123.45,
  payer_id: randomUUID(),
  payer_email: 'demo@example.com',
  reference: randomUUID(),
  scenario: 'normal',
});
describe('SnailPay contract and invariants', () => {
  it('approves the required fixture, including its fixed expiration', async () => {
    const data = input();
    const response = await request(createApp()).post('/api/snailpay/payments').send(data);
    expect(response.status).toBe(200);
    expect(paymentResponseSchema.safeParse(response.body).success).toBe(true);
    expect(response.body).toMatchObject({
      status: 'approved',
      transaction_amount: 123.45,
      payer_id: data.payer_id,
      card_number: data.card_number,
      cvv: '543',
    });
    expect(response.body.authorization_code).toMatch(/^SIM-/);
  });
  it('rejects the documented declined card', async () => {
    const response = await request(createApp())
      .post('/api/snailpay/payments')
      .send({ ...input(), ...testCards.declined });
    expect(response.status).toBe(422);
    expect(response.body.status_detail).toBe('card_declined');
    expect(response.body.authorization_code).toBeNull();
  });
  it.each([0, -10, 0.001, 1000000.01, '100', null])(
    'rejects invalid amount %s',
    async (transaction_amount) => {
      const response = await request(createApp())
        .post('/api/snailpay/payments')
        .send({ ...input(), transaction_amount });
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('rejected');
      expect(paymentResponseSchema.safeParse(response.body).success).toBe(true);
    },
  );
  it('accepts one cent without rounding it away', async () => {
    const response = await request(createApp())
      .post('/api/snailpay/payments')
      .send({ ...input(), transaction_amount: 0.01 });
    expect(response.body).toMatchObject({ status: 'approved', transaction_amount: 0.01 });
  });
  it('rejects unrecognized card input without reflecting it', async () => {
    const response = await request(createApp())
      .post('/api/snailpay/payments')
      .send({ ...input(), card_number: '9999999999999999', cvv: '987' });
    expect(response.status).toBe(400);
    expect(response.body.card_number).toBeNull();
    expect(response.body.cvv).toBeNull();
  });
  it('returns a full contract on malformed JSON', async () => {
    const response = await request(createApp())
      .post('/api/snailpay/payments')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(response.status).toBe(400);
    expect(paymentResponseSchema.safeParse(response.body).success).toBe(true);
  });
  it('returns the same operation on retry, and rejects a changed request with the same reference', async () => {
    const app = createApp(),
      data = input();
    const first = await request(app).post('/api/snailpay/payments').send(data);
    const second = await request(app).post('/api/snailpay/payments').send(data);
    expect(second.body).toEqual(first.body);
    const conflict = await request(app)
      .post('/api/snailpay/payments')
      .send({ ...data, transaction_amount: 300 });
    expect(conflict.status).toBe(409);
    expect(conflict.body.status_detail).toBe('reference_conflict');
  });
  it('does not replay cached approvals during a global failure', async () => {
    const options = { systemError: false },
      app = createApp(options),
      data = input();
    await request(app).post('/api/snailpay/payments').send(data);
    options.systemError = true;
    const response = await request(app).post('/api/snailpay/payments').send(data);
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.authorization_code).toBeNull();
  });
  it('simulates internal failure with the documented request field', async () => {
    const response = await request(createApp())
      .post('/api/snailpay/payments')
      .send({ ...input(), scenario: 'system_error' });
    expect(response.status).toBe(503);
    expect(paymentResponseSchema.safeParse(response.body).success).toBe(true);
  });
  it('never approves the delayed scenario', async () => {
    const response = await request(createApp({ timeoutMs: 5 }))
      .post('/api/snailpay/payments')
      .send({ ...input(), scenario: 'timeout' });
    expect(response.status).toBe(504);
    expect(response.body.status).toBe('error');
    expect(response.body.authorization_code).toBeNull();
  });
});
