import { z } from 'zod';

export const MAX_AMOUNT_CENTS = 100_000_000;
export const testCards = {
  approved: { card_number: '1234123412341234', expiration: '12/26', cvv: '543' },
  declined: { card_number: '1111111111111111', expiration: '12/26', cvv: '111' },
} as const;
export const scenarioSchema = z.enum(['normal', 'system_error', 'timeout']);
export type Scenario = z.infer<typeof scenarioSchema>;
// Fixed fixtures, not real bank-card validation. The approval fixture never expires.
export const paymentRequestSchema = z.object({
  card_number: z.enum([testCards.approved.card_number, testCards.declined.card_number]),
  expiration: z.string().regex(/^\d{2}\/\d{2}$/),
  cvv: z.enum([testCards.approved.cvv, testCards.declined.cvv]),
  cardholder_name: z.string().trim().min(1).max(120),
  transaction_amount: z
    .number()
    .finite()
    .positive()
    .max(MAX_AMOUNT_CENTS / 100)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
      'Máximo dos decimales',
    ),
  payer_id: z.string().uuid(),
  payer_email: z.email(),
  reference: z.string().uuid(),
  scenario: scenarioSchema.default('normal'),
});
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
export const paymentResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'error']),
  status_detail: z.string(),
  transaction_amount: z.number().nonnegative(),
  date_created: z.iso.datetime(),
  authorization_code: z.string().nullable(),
  reference: z.string(),
  payer_id: z.string(),
  payer_email: z.string(),
  // Echo only known fictitious values; unrecognized card data is never reflected.
  card_number: z.enum([testCards.approved.card_number, testCards.declined.card_number]).nullable(),
  cvv: z.enum([testCards.approved.cvv, testCards.declined.cvv]).nullable(),
});
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export const registrationSchema = z
  .object({
    name: z.string().trim().min(2, 'Escribe tu nombre completo.').max(100),
    email: z.email('Escribe un correo válido.').transform((value) => value.toLowerCase()),
    password: z.string().min(10, 'Usa al menos 10 caracteres.').max(128),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmation'],
  });
export type Registration = z.infer<typeof registrationSchema>;
