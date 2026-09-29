import { beforeEach, describe, it, expect } from 'vitest';
import { LocalAccountRepository, STORAGE_KEY } from '../storage/repository';
import { createAccountService } from './account';
import type { PaymentResponse } from '../../../../packages/contracts/src/index';
let values: Map<string, string>;
let service: ReturnType<typeof createAccountService>;
const registration = {
  name: 'Ana Demo',
  email: 'ANA@example.com',
  password: 'una-clave-demo-123',
  confirmation: 'una-clave-demo-123',
};
beforeEach(() => {
  values = new Map();
  service = createAccountService(
    new LocalAccountRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    }),
  );
});
async function payment(status: PaymentResponse['status'] = 'approved'): Promise<PaymentResponse> {
  const account = (await service.read())!;
  return {
    id: crypto.randomUUID(),
    reference: crypto.randomUUID(),
    status,
    status_detail: status === 'approved' ? 'accredited' : 'card_declined',
    transaction_amount: 0.1,
    date_created: new Date().toISOString(),
    authorization_code: status === 'approved' ? 'SIM-TEST' : null,
    payer_id: account.user.id,
    payer_email: account.user.email,
    card_number: '1234123412341234',
    cvv: '543',
  };
}
describe('Local account and wallet', () => {
  it('persists a password verifier, starts at zero and supports logout/login', async () => {
    const account = await service.register(registration);
    expect(account.balanceCents).toBe(0);
    expect(account.user.email).toBe('ana@example.com');
    expect(values.get(STORAGE_KEY)).not.toContain(registration.password);
    await service.logout();
    expect((await service.read())!.session).toBeNull();
    await expect(service.login('ana@example.com', 'incorrecta')).rejects.toThrow(
      'no son correctos',
    );
    expect(
      (await service.login(' ANA@example.com ', registration.password)).session,
    ).not.toBeNull();
  });
  it('rejects confirmation mismatch and preserves an existing account', async () => {
    await expect(service.register({ ...registration, confirmation: 'otra' })).rejects.toThrow(
      'no coinciden',
    );
    await service.register(registration);
    await expect(service.register(registration)).rejects.toThrow('Ya existe');
  });
  it('credits once, persists mock card fields, and sums cents exactly', async () => {
    await service.register(registration);
    const first = await payment();
    await service.recordPayment(first);
    await service.recordPayment(first);
    await service.recordPayment({ ...first, id: crypto.randomUUID() });
    const second = await payment();
    second.transaction_amount = 0.2;
    const account = await service.recordPayment(second);
    expect(account.balanceCents).toBe(30);
    expect(account.transactions).toHaveLength(2);
    expect(account.transactions[0].cvv).toBe('543');
    expect((await service.read())!.balanceCents).toBe(30);
  });
  it.each(['rejected', 'error'] as const)('records %s without changing balance', async (status) => {
    await service.register(registration);
    const account = await service.recordPayment(await payment(status));
    expect(account.balanceCents).toBe(0);
    expect(account.transactions).toHaveLength(1);
  });
  it('rejects a payment for another user and an update after logout', async () => {
    await service.register(registration);
    const data = await payment();
    await expect(service.recordPayment({ ...data, payer_id: crypto.randomUUID() })).rejects.toThrow(
      'no corresponde',
    );
    await service.logout();
    await expect(service.recordPayment(data)).rejects.toThrow('sesión ha terminado');
  });
  it('serializes concurrent payments without losing one', async () => {
    await service.register(registration);
    const first = await payment(),
      second = await payment();
    await Promise.all([service.recordPayment(first), service.recordPayment(second)]);
    expect((await service.read())!.balanceCents).toBe(20);
  });
  it('preserves corrupt data instead of silently resetting the balance', async () => {
    values.set(STORAGE_KEY, '{broken');
    await expect(service.read()).rejects.toThrow('dañados');
    expect(values.get(STORAGE_KEY)).toBe('{broken');
  });
  it('reports a storage write failure instead of reporting a successful update', async () => {
    const broken = createAccountService(
      new LocalAccountRepository({
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceeded');
        },
      }),
    );
    await expect(broken.register(registration)).rejects.toThrow('No se pudieron guardar');
  });
});
