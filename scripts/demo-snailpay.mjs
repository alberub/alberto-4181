import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const scenarios = {
  approved: { expected: 200, changes: {} },
  declined: { expected: 422, changes: { card_number: '1111111111111111', cvv: '111' } },
  'system-error': { expected: 503, changes: { scenario: 'system_error' } },
  timeout: { expected: 504, changes: { scenario: 'timeout' } },
  invalid: { expected: 400, changes: { transaction_amount: 0 } },
};
const name = process.argv[2];
if (!Object.hasOwn(scenarios, name ?? '')) {
  console.error('Uso: npm run demo:snailpay -- approved|declined|system-error|timeout|invalid');
  process.exitCode = 1;
} else {
  const scenario = scenarios[name];
  const payload = {
    card_number: '1234123412341234',
    expiration: '12/26',
    cvv: '543',
    cardholder_name: 'Usuario Demo',
    transaction_amount: 200,
    payer_id: randomUUID(),
    payer_email: 'demo@example.com',
    reference: randomUUID(),
    scenario: 'normal',
    ...scenario.changes,
  };
  try {
    const response = await fetch(
      process.env.SNAILPAY_URL ?? 'http://127.0.0.1:3001/api/snailpay/payments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      },
    );
    console.log(`Escenario: ${name}\nHTTP ${response.status}`);
    console.log(JSON.stringify(await response.json(), null, 2));
    assert.equal(response.status, scenario.expected, 'Respuesta distinta del escenario esperado');
    console.log('El API no modifica el LocalStorage del navegador.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
