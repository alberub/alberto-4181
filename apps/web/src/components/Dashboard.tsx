import { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Spiral,
  House,
  DotsThree,
  ArrowRight,
  ArrowDownLeft,
  Wallet,
  Plant,
  CreditCard,
  ArrowsDownUp,
  Clock,
} from '@phosphor-icons/react';
import type { Account } from '../storage/repository';
import { money } from '../services/fixtures';
import { PaymentForm } from './PaymentForm';
import { PaymentModal } from './PaymentModal';
import { paymentMessages } from '../services/payments';
import { RaceStatistics } from './RaceStatistics';
import { AccountMenu } from './AccountMenu';

export type DashboardView = 'home' | 'topup';
export function Dashboard({
  account,
  onAccount,
  view = 'home',
}: {
  account: Account;
  onAccount: (account: Account | null) => void;
  view?: DashboardView;
}) {
  const [error, setError] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const name = account.user.name.split(' ')[0];
  const status = params.get('estado') ?? 'all';
  const visiblePayments = account.transactions.filter(
    (payment) => status === 'all' || payment.status === status,
  );
  const initialAmount = [100, 200, 500].includes(Number(params.get('monto')))
    ? Number(params.get('monto'))
    : 200;
  const initials = account.user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  return (
    <div className="app-shell">
      {accountMenuOpen && (
        <AccountMenu
          account={account}
          onAccount={onAccount}
          onClose={() => setAccountMenuOpen(false)}
        />
      )}
      {paymentOpen && view === 'home' && (
        <PaymentModal
          account={account}
          onAccount={onAccount}
          onClose={() => setPaymentOpen(false)}
        />
      )}
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand">
          <Spiral size={29} weight="duotone" />
          <span>
            Snail<span className="brand-light">Club</span>
          </span>
        </NavLink>
        <nav className="sidebar-navigation" aria-label="Navegación principal">
          <NavLink to="/dashboard" className="nav-item" title="Dashboard">
            <House size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/recargar" className="nav-item" title="Cargar saldo">
            <Wallet size={20} />
            <span>Cargar saldo</span>
          </NavLink>
        </nav>
        <button
          className="sidebar-account"
          aria-haspopup="dialog"
          aria-expanded={accountMenuOpen}
          onClick={() => setAccountMenuOpen(true)}
        >
          <span className="sidebar-account-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="sidebar-account-copy">
            <strong>{account.user.name}</strong>
            <small>{account.user.email}</small>
          </span>
          <DotsThree size={20} weight="bold" aria-hidden="true" />
        </button>
      </aside>
      <div className="workspace">
        <main id="main-content" className="dashboard" key={view}>
          {view === 'home' ? (
            <section className="welcome">
              <div className="welcome-mark" aria-hidden="true">
                <Plant size={44} weight="duotone" />
                <span />
              </div>
              <div>
                <h1>{`Hola, ${name}.`}</h1>
                <h2>{view === 'home' ? 'Tu día en la pista.' : 'Carga saldo a tu ritmo.'}</h2>
                <p>
                  {view === 'home'
                    ? 'Tu saldo y los resultados de una jornada simulada.'
                    : 'Recarga con SnailPay usando únicamente datos ficticios.'}
                </p>
              </div>
            </section>
          ) : (
            <header className="topup-heading">
              <span className="pay-eyebrow">TU CUENTA</span>
              <h1>Cargar saldo</h1>
              <p>Realiza una recarga y consulta tus operaciones con SnailPay.</p>
            </header>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {view === 'home' && (
            <>
              <section className="balance-composer" aria-label="Tu saldo">
                <div className="composer-label">
                  Tu saldo disponible <span>Sin dinero real</span>
                </div>
                <strong className="balance-number" data-testid="balance">
                  {money(account.balanceCents)}
                </strong>
                <div className="composer-footer">
                  <div className="composer-options">
                    <Wallet size={20} />
                    <span className="composer-chip">
                      <CreditCard size={16} />
                      SnailPay
                    </span>
                    <span className="composer-chip">
                      Pesos mexicanos <span className="currency">MXN</span>
                    </span>
                  </div>
                  <button
                    className="button primary dashboard-topup"
                    onClick={() => setPaymentOpen(true)}
                  >
                    Cargar saldo <ArrowRight size={20} />
                  </button>
                </div>
              </section>
              <section className="statistics-section" aria-label="Resultados simulados">
                <RaceStatistics />
              </section>
            </>
          )}
          {view === 'topup' && (
            <div className="topup-layout">
              <section className="topup-page topup-redesigned">
                <PaymentForm
                  account={account}
                  onAccount={onAccount}
                  onDone={() => navigate('/dashboard')}
                  initialAmount={initialAmount}
                />
              </section>
              <section
                className="panel transactions-panel topup-history"
                aria-label="Historial de recargas"
              >
                <div className="panel-heading">
                  <h2>
                    <Clock size={20} />
                    Historial de recargas
                  </h2>
                </div>
                {
                  <div className="activity-filters" aria-label="Filtrar recargas">
                    {[
                      { value: 'all', label: 'Todas' },
                      { value: 'approved', label: 'Aprobadas' },
                      { value: 'rejected', label: 'Rechazadas' },
                      { value: 'error', label: 'Errores' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        aria-pressed={status === filter.value}
                        onClick={() =>
                          setParams(filter.value === 'all' ? {} : { estado: filter.value })
                        }
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                }
                {visiblePayments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <ArrowsDownUp size={20} />
                    </span>
                    <div>
                      <h3>
                        {account.transactions.length
                          ? 'No hay recargas con este estado.'
                          : 'Todavía no tienes movimientos.'}
                      </h3>
                      <p>
                        {account.transactions.length
                          ? 'Prueba con otro filtro para consultar tus operaciones.'
                          : 'Tu primera recarga aparecerá aquí, con todos sus detalles.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="transaction-list">
                    {visiblePayments.map((payment) => (
                      <article className="transaction" key={payment.id}>
                        <span className={`transaction-icon ${payment.status}`}>
                          <ArrowDownLeft size={17} />
                        </span>
                        <div className="transaction-detail">
                          <strong>Recarga con SnailPay</strong>
                          {
                            <small>
                              {paymentMessages[payment.status_detail] ?? payment.status_detail}
                            </small>
                          }
                        </div>
                        <span className={`status-badge ${payment.status}`}>
                          {payment.status === 'approved'
                            ? 'Aprobada'
                            : payment.status === 'rejected'
                              ? 'Rechazada'
                              : 'Error'}
                        </span>
                        <strong className="transaction-amount">
                          {payment.status === 'approved' ? '+' : ''}
                          {money(Math.round(payment.transaction_amount * 100))}
                        </strong>
                        <time dateTime={payment.date_created}>
                          {new Intl.DateTimeFormat('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(payment.date_created))}
                        </time>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
