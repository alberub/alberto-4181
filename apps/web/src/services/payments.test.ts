import { describe, expect, it } from 'vitest';
import { requestPayment } from './payments';
import { testCards, type PaymentRequest } from '../../../../packages/contracts/src/index';
const input: PaymentRequest = {
  ...testCards.approved,
  cardholder_name: 'Ana Demo',
  transaction_amount: 200,
  payer_id: crypto.randomUUID(),
  payer_email: 'demo@example.com',
  reference: crypto.randomUUID(),
  scenario: 'normal',
};
const body = () => ({
  ...input,
  id: crypto.randomUUID(),
  status: 'approved',
  status_detail: 'accredited',
  date_created: new Date().toISOString(),
  authorization_code: 'SIM-TEST',
});
describe('Payment transport boundaries', () => {
  it('rejects malformed success payloads', async () => {
    const fetcher = (async () => new Response('{}')) as typeof fetch;
    await expect(requestPayment(input, 100, fetcher)).rejects.toThrow('Respuesta inválida');
  });
  it('does not accept an approval attached to an HTTP error', async () => {
    const fetcher = (async () =>
      new Response(JSON.stringify(body()), { status: 503 })) as typeof fetch;
    await expect(requestPayment(input, 100, fetcher)).rejects.toThrow('no corresponde');
  });
  it('rejects a response for a different amount', async () => {
    const fetcher = (async () =>
      new Response(JSON.stringify({ ...body(), transaction_amount: 300 }))) as typeof fetch;
    await expect(requestPayment(input, 100, fetcher)).rejects.toThrow('no corresponde');
  });
  it('handles connection failures', async () => {
    const fetcher = (async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;
    await expect(requestPayment(input, 100, fetcher)).rejects.toThrow('No pudimos conectar');
  });
  it('aborts a slow request and reports no credit', async () => {
    const fetcher = ((_url, options) =>
      new Promise((_resolve, reject) =>
        options?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        ),
      )) as typeof fetch;
    await expect(requestPayment(input, 5, fetcher)).rejects.toThrow('tardó demasiado');
  });
});
