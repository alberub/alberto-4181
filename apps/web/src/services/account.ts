import {
  registrationSchema,
  type Registration,
  type PaymentResponse,
} from '../../../../packages/contracts/src/index';
import type { Account, AccountRepository } from '../storage/repository';

const toHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
async function derive(password: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: Uint8Array.from(salt.match(/../g)!, (byte) => parseInt(byte, 16)),
      iterations: 210000,
      hash: 'SHA-256',
    },
    material,
    256,
  );
  return toHex(new Uint8Array(bits));
}
// Browser lock serializes updates across tabs. Node tests use a service-local queue.
export function createAccountService(repository: AccountRepository) {
  let queue: Promise<unknown> = Promise.resolve();
  function mutate<T>(operation: () => Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.locks)
      return navigator.locks.request('snail-club-account', operation);
    const next = queue.then(operation, operation);
    queue = next.catch(() => undefined);
    return next;
  }
  async function active(): Promise<Account> {
    const account = await repository.read();
    if (!account?.session) throw new Error('Tu sesión ha terminado. Inicia sesión nuevamente.');
    return account;
  }
  return {
    read: () => repository.read(),
    register: (values: Registration) =>
      mutate(async () => {
        const parsed = registrationSchema.safeParse(values);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        if (await repository.read())
          throw new Error('Ya existe una cuenta en este navegador. Inicia sesión.');
        const { name, email, password } = parsed.data;
        const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
        const user = {
          id: crypto.randomUUID(),
          name,
          email,
          salt,
          iterations: 210000 as const,
          passwordHash: await derive(password, salt),
        };
        const account: Account = {
          version: 1,
          user,
          session: { userId: user.id },
          balanceCents: 0,
          transactions: [],
        };
        await repository.write(account);
        return account;
      }),
    login: (email: string, password: string) =>
      mutate(async () => {
        const account = await repository.read();
        if (
          !account ||
          account.user.email !== email.trim().toLowerCase() ||
          (await derive(password, account.user.salt)) !== account.user.passwordHash
        ) {
          throw new Error('El correo o la contraseña no son correctos.');
        }
        const next = { ...account, session: { userId: account.user.id } };
        await repository.write(next);
        return next;
      }),
    logout: () =>
      mutate(async () => {
        const account = await repository.read();
        if (!account) return null;
        const next = { ...account, session: null };
        await repository.write(next);
        return next;
      }),
    recordPayment: (payment: PaymentResponse) =>
      mutate(async () => {
        const account = await active();
        if (payment.payer_id !== account.user.id || payment.payer_email !== account.user.email)
          throw new Error('La operación no corresponde a tu cuenta.');
        const existing = account.transactions.find(
          (item) => item.id === payment.id || item.reference === payment.reference,
        );
        if (existing) return account;
        if (
          payment.status === 'approved' &&
          (!payment.authorization_code ||
            payment.transaction_amount <= 0 ||
            !Number.isSafeInteger(Math.round(payment.transaction_amount * 100)))
        )
          throw new Error('La aprobación recibida no es válida.');
        const next = {
          ...account,
          balanceCents:
            account.balanceCents +
            (payment.status === 'approved' ? Math.round(payment.transaction_amount * 100) : 0),
          transactions: [payment, ...account.transactions],
        };
        // One write persists the balance and operation together. UI changes only after success.
        await repository.write(next);
        return next;
      }),
  };
}
export type AccountService = ReturnType<typeof createAccountService>;
