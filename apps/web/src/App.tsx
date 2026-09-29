import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { STORAGE_KEY, type Account } from './storage/repository';
import { accountService } from './services/browser-account';
import { Auth } from './components/Auth';
const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard })),
);

export function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () =>
      accountService
        .read()
        .then((value) => {
          setAccount(value);
          setError('');
        })
        .catch((error) => setError(error.message))
        .finally(() => setReady(true));
    void refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) void refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  if (!ready)
    return (
      <main className="center-state" aria-busy="true">
        <div className="skeleton" />
        <p>Preparando tu espacio…</p>
      </main>
    );
  if (error)
    return (
      <main className="center-state">
        <h1>No pudimos abrir tu cuenta</h1>
        <p role="alert">{error}</p>
        <p>Conservamos los datos existentes para evitar perder tu información.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Volver a intentar
        </button>
      </main>
    );
  return (
    <Suspense
      fallback={
        <main className="center-state" aria-busy="true">
          <p>Cargando tu dashboard…</p>
        </main>
      }
    >
      <Routes>
        <Route
          path="/acceso"
          element={
            account?.session ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth hasAccount={Boolean(account)} onAccount={setAccount} />
            )
          }
        />
        {(
          [
            ['/dashboard', 'home'],
            ['/recargar', 'topup'],
          ] as const
        ).map(([path, view]) => (
          <Route
            key={path}
            path={path}
            element={
              account?.session ? (
                <Dashboard account={account} onAccount={setAccount} view={view} />
              ) : (
                <Navigate to="/acceso" replace />
              )
            }
          />
        ))}
        <Route
          path="*"
          element={<Navigate to={account?.session ? '/dashboard' : '/acceso'} replace />}
        />
      </Routes>
    </Suspense>
  );
}
