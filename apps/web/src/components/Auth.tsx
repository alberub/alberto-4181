import { useState, type FormEvent } from 'react';
import { Spiral, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { accountService } from '../services/browser-account';
import type { Account } from '../storage/repository';
export function Auth({
  hasAccount,
  onAccount,
}: {
  hasAccount: boolean;
  onAccount: (account: Account) => void;
}) {
  const [register, setRegister] = useState(!hasAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    try {
      const account = register
        ? await accountService.register({
            name: value('name'),
            email: value('email'),
            password: String(data.get('password')),
            confirmation: String(data.get('confirmation')),
          })
        : await accountService.login(value('email'), String(data.get('password')));
      onAccount(account);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No pudimos completar la solicitud.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a href="/" className="brand">
          <Spiral size={34} weight="duotone" />
          <span>
            snail<span className="brand-light">club</span>
          </span>
        </a>
        <div className="story-content">
          <div className="snail-art" aria-hidden="true">
            <div className="track-ring ring-one" />
            <div className="track-ring ring-two" />
            <Spiral size={170} weight="duotone" />
          </div>
        </div>
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <span className="eyebrow">BIENVENIDO AL CLUB</span>
          <h2>{register ? 'Tu primera vuelta empieza aquí.' : 'Qué bueno verte de nuevo.'}</h2>
          <div className="auth-tabs" aria-label="Opciones de acceso">
            <button
              type="button"
              aria-pressed={!register}
              onClick={() => {
                setRegister(false);
                setError('');
              }}
              disabled={busy}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              aria-pressed={register}
              onClick={() => {
                setRegister(true);
                setError('');
              }}
              disabled={busy}
            >
              Crear cuenta
            </button>
          </div>
          <form onSubmit={submit} className="form" key={register ? 'register' : 'login'}>
            {register && (
              <label>
                Nombre completo
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={busy}
                />
              </label>
            )}
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                required
                maxLength={254}
                disabled={busy}
              />
            </label>
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder={register ? 'Al menos 10 caracteres' : 'Tu contraseña'}
                minLength={register ? 10 : undefined}
                maxLength={128}
                required
                disabled={busy}
              />
            </label>
            {register && (
              <label>
                Confirmar contraseña
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Escribe tu contraseña otra vez"
                  required
                  maxLength={128}
                  disabled={busy}
                />
              </label>
            )}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy} type="submit">
              {busy ? 'Un momento…' : register ? 'Crear mi cuenta' : 'Entrar al club'}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="local-note">
            <CheckCircle size={18} /> Tu cuenta se conserva en este navegador.
          </p>
        </div>
      </section>
    </main>
  );
}
