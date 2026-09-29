import { useEffect, useRef, useState } from 'react';
import { SignOut, X } from '@phosphor-icons/react';
import { accountService } from '../services/browser-account';
import type { Account } from '../storage/repository';

export function AccountMenu({
  account,
  onAccount,
  onClose,
}: {
  account: Account;
  onAccount: (account: Account | null) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      onAccount(await accountService.logout());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.');
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="account-menu"
      aria-label="Opciones de cuenta"
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
    >
      <div className="account-menu-header">
        <div>
          <strong>{account.user.name}</strong>
          <span>{account.user.email}</span>
        </div>
        <button
          type="button"
          aria-label="Cerrar opciones de cuenta"
          onClick={() => dialog.current?.close()}
          disabled={busy}
        >
          <X size={18} />
        </button>
      </div>
      <button type="button" className="account-menu-logout" onClick={logout} disabled={busy}>
        <SignOut size={19} />
        {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </dialog>
  );
}
