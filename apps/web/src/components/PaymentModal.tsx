import { useEffect, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { Account } from '../storage/repository';
import { PaymentForm } from './PaymentForm';

export function PaymentModal({
  account,
  onAccount,
  onClose,
}: {
  account: Account;
  onAccount: (account: Account) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="pay-modal"
      aria-label="Cargar saldo con SnailPay"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
    >
      <button
        className="pay-modal-close"
        aria-label="Cerrar recarga"
        disabled={busy}
        onClick={() => dialog.current?.close()}
      >
        <X size={20} />
      </button>
      <PaymentForm
        account={account}
        onAccount={onAccount}
        onDone={() => dialog.current?.close()}
        onBusyChange={setBusy}
        doneLabel="Listo, volver al dashboard"
      />
    </dialog>
  );
}
