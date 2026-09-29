import {
  paymentRequestSchema,
  paymentResponseSchema,
  type PaymentRequest,
} from '../../../../packages/contracts/src/index';
export const paymentMessages: Record<string, string> = {
  accredited: 'Recarga aprobada. Tu saldo ya está actualizado.',
  card_declined: 'La tarjeta de prueba fue rechazada. Tu saldo no cambió.',
  invalid_data: 'Revisa el monto y los datos de prueba. Tu saldo no cambió.',
  service_unavailable: 'SnailPay no está disponible en este momento. Tu saldo no cambió.',
  gateway_timeout: 'SnailPay tardó demasiado en responder. Tu saldo no cambió.',
  reference_conflict: 'La referencia ya pertenece a otra operación. Tu saldo no cambió.',
};
export async function requestPayment(
  input: PaymentRequest,
  timeoutMs = 3500,
  fetcher: typeof fetch = fetch,
) {
  const valid = paymentRequestSchema.safeParse(input);
  if (!valid.success)
    throw new Error(
      'Revisa los datos: usa tarjetas ficticias y un monto de $0.01 a $1,000,000.00 con máximo dos decimales.',
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher('/api/snailpay/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid.data),
      signal: controller.signal,
    });
    const result = paymentResponseSchema.safeParse(await response.json());
    if (!result.success) throw new Error('Respuesta inválida de SnailPay. Tu saldo no cambió.');
    const payment = result.data;
    if (
      payment.reference !== input.reference ||
      payment.payer_id !== input.payer_id ||
      payment.payer_email !== input.payer_email ||
      payment.transaction_amount !== input.transaction_amount ||
      (!response.ok && payment.status === 'approved')
    ) {
      throw new Error('La respuesta no corresponde a esta recarga. Tu saldo no cambió.');
    }
    return payment;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(paymentMessages.gateway_timeout);
    if (error instanceof TypeError)
      throw new Error(
        'No pudimos conectar con SnailPay. Revisa que el servidor esté disponible. Tu saldo no cambió.',
      );
    if (error instanceof SyntaxError)
      throw new Error('Respuesta inválida de SnailPay. Tu saldo no cambió.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
