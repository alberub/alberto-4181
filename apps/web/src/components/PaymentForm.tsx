import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle, CreditCard, Wallet } from '@phosphor-icons/react';
import { testCards, type Scenario } from '../../../../packages/contracts/src/index';
import type { Account } from '../storage/repository';
import { accountService } from '../services/browser-account';
import { requestPayment, paymentMessages } from '../services/payments';
import { money } from '../services/fixtures';
export function PaymentForm({
  account,
  onAccount,
  onDone,
  initialAmount = 200,
  onBusyChange,
  doneLabel = 'Volver al dashboard',
}: {
  account: Account;
  onAccount: (account: Account) => void;
  initialAmount?: number;
  onBusyChange?: (busy: boolean) => void;
  doneLabel?: string;
  onDone: () => void;
}) {
  const amountId = useId();
  const [scenario, setScenario] = useState('approved');
  const [amount, setAmount] = useState(String(initialAmount));
  useEffect(() => {
    setAmount(String(initialAmount));
  }, [initialAmount]);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const fixture = scenario === 'declined' ? testCards.declined : testCards.approved;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setMessage('');
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    try {
      const payment = await requestPayment({
        ...fixture,
        cardholder_name: String(form.get('holder') ?? '').trim(),
        transaction_amount: Number(amount),
        payer_id: account.user.id,
        payer_email: account.user.email,
        reference: crypto.randomUUID(),
        scenario: (scenario === 'system_error' || scenario === 'timeout'
          ? scenario
          : 'normal') as Scenario,
      });
      const updated = await accountService.recordPayment(payment);
      onAccount(updated);
      setSuccess(payment.status === 'approved');
      setReference(payment.reference);
      setMessage(
        paymentMessages[payment.status_detail] ??
          'No se pudo completar la recarga. Tu saldo no cambió.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la recarga.');
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      inFlight.current = false;
    }
  }
  return (
    <section className="pay-surface" aria-label="Recarga de saldo">
      <header className="pay-header">
        <span className="pay-brand-icon">
          <CreditCard size={23} />
        </span>
        <div>
          <span className="pay-eyebrow">SNAILPAY</span>
          <h2>Cargar saldo</h2>
        </div>
        <span className="pay-demo-badge">Modo de prueba</span>
      </header>
      {success ? (
        <div className="pay-success">
          <CheckCircle size={48} weight="duotone" />
          <h3>Recarga completada</h3>
          <p role="status">{message}</p>
          <div className="pay-success-balance">
            <span>Tu nuevo saldo</span>
            <strong>{money(account.balanceCents)}</strong>
          </div>
          <p className="pay-reference">Referencia: {reference}</p>
          <button className="button primary" onClick={onDone}>
            {doneLabel}
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="form pay-form" aria-busy={busy}>
          <div className="pay-grid">
            <div className="pay-amount-panel">
              <label htmlFor={amountId}>Monto de la recarga</label>
              <div className="pay-amount-control">
                <span aria-hidden="true">$</span>
                <input
                  id={amountId}
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={busy}
                />
                <span>MXN</span>
              </div>
              <div className="pay-presets" aria-label="Montos sugeridos">
                {[100, 200, 500].map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={Number(amount) === value}
                    onClick={() => setAmount(String(value))}
                    disabled={busy}
                  >
                    ${value}
                  </button>
                ))}
              </div>
              <div className="pay-current-balance">
                <Wallet size={19} />
                <div>
                  <span>Saldo actual</span>
                  <strong data-testid="payment-balance">{money(account.balanceCents)}</strong>
                </div>
              </div>
              <p className="pay-amount-note">
                Recarga de demostración. No se realizan cargos reales.
              </p>
            </div>
            <div className="pay-fields">
              <div className="pay-fields-title">
                <h3>Datos de la recarga</h3>
                <p>Tarjeta ficticia para probar SnailPay.</p>
              </div>
              <label>
                Escenario de prueba
                <select
                  value={scenario}
                  onChange={(event) => {
                    setScenario(event.target.value);
                    setMessage('');
                  }}
                  disabled={busy}
                >
                  <option value="approved">Recarga aprobada</option>
                  <option value="declined">Tarjeta rechazada</option>
                  <option value="system_error">Servicio no disponible</option>
                  <option value="timeout">Tiempo de espera agotado</option>
                </select>
              </label>
              <label>
                Nombre del titular
                <input
                  name="holder"
                  defaultValue={account.user.name}
                  maxLength={120}
                  required
                  disabled={busy}
                  autoComplete="off"
                />
              </label>
              <label>
                Número de tarjeta de prueba
                <input className="pay-card-number" value={fixture.card_number} readOnly />
              </label>
              <div className="pay-field-pair">
                <label>
                  Vencimiento
                  <input value={fixture.expiration} readOnly />
                </label>
                <label>
                  CVV ficticio
                  <input value={fixture.cvv} readOnly />
                </label>
              </div>
              <p className="pay-field-note">
                Los datos de tarjeta se completan según el escenario.
              </p>
            </div>
          </div>
          <footer className="pay-footer">
            {message && (
              <p className="notice error pay-error" role="alert">
                {message}
              </p>
            )}
            <p>
              La tarjeta y el CVV ficticios se guardan en este navegador junto con la operación.
            </p>
            <button className="button primary" disabled={busy}>
              {busy
                ? 'Procesando recarga…'
                : `Recargar ${money(Math.round(Number(amount || 0) * 100))}`}
              <ArrowRight size={18} />
            </button>
          </footer>
        </form>
      )}
    </section>
  );
}
