import { z } from 'zod';
import { paymentResponseSchema } from '../../../../packages/contracts/src/index';

export const STORAGE_KEY = 'snail-club:v1';
export const accountSchema = z
  .object({
    version: z.literal(1),
    user: z.object({
      id: z.string().uuid(),
      name: z.string().min(2),
      email: z.email(),
      passwordHash: z.string().regex(/^[0-9a-f]{64}$/),
      salt: z.string().regex(/^[0-9a-f]{32}$/),
      iterations: z.literal(210000),
    }),
    session: z.object({ userId: z.string().uuid() }).nullable(),
    balanceCents: z.number().int().nonnegative().safe(),
    transactions: z.array(paymentResponseSchema),
  })
  .superRefine((value, ctx) => {
    const approved = value.transactions.filter((item) => item.status === 'approved');
    const total = approved.reduce(
      (sum, item) => sum + Math.round(item.transaction_amount * 100),
      0,
    );
    if (
      total !== value.balanceCents ||
      new Set(approved.map((item) => item.reference)).size !== approved.length ||
      value.transactions.some(
        (item) => item.payer_id !== value.user.id || item.payer_email !== value.user.email,
      ) ||
      (value.session !== null && value.session.userId !== value.user.id)
    ) {
      ctx.addIssue({ code: 'custom', message: 'Inconsistent account' });
    }
  });
export type Account = z.infer<typeof accountSchema>;
export interface AccountRepository {
  read(): Promise<Account | null>;
  write(account: Account): Promise<void>;
}
export class LocalAccountRepository implements AccountRepository {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'>) {}
  async read(): Promise<Account | null> {
    let raw: string | null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch {
      throw new Error('No se puede acceder al almacenamiento del navegador. Revisa sus permisos.');
    }
    if (!raw) return null;
    try {
      return accountSchema.parse(JSON.parse(raw));
    } catch {
      throw new Error(
        'Los datos locales están dañados o son incompatibles. No se han sobrescrito.',
      );
    }
  }
  async write(account: Account): Promise<void> {
    accountSchema.parse(account);
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch {
      throw new Error(
        'No se pudieron guardar los cambios. El almacenamiento está lleno o bloqueado.',
      );
    }
  }
}
