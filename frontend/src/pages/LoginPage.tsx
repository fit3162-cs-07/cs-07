import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ApiError } from '../api/client';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Sign-in failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = () => {
    show('Password reset is coming soon. Ask an admin to reset it for now.', 'success');
  };

  return (
    <div className="auth-bg auth-pattern min-h-full relative flex flex-col">
      <header className="relative z-10 h-14 px-6 flex items-center justify-between">
        <Logo size="md" />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-surface rounded-2xl shadow-2xl ring-1 ring-border-default/60 px-8 py-10 sm:px-10 sm:py-12">
            <div className="text-center mb-8">
              <h1 className="text-h1 font-bold text-text-primary tracking-tight">Log In</h1>
              <p className="text-sm text-text-secondary mt-2">
                Use your Monash email to sign in
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-text-primary mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-text-tertiary pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="Enter your Monash email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full h-12 pl-11 pr-3 text-sm text-text-primary bg-surface border border-border-strong rounded-lg placeholder:text-text-tertiary hover:border-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-DEFAULT ease-DEFAULT"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-text-primary mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-text-tertiary pointer-events-none"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full h-12 pl-11 pr-12 text-sm text-text-primary bg-surface border border-border-strong rounded-lg placeholder:text-text-tertiary hover:border-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-DEFAULT ease-DEFAULT"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-muted inline-flex items-center justify-center transition-colors duration-DEFAULT ease-DEFAULT"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" aria-hidden />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="inline-flex items-center gap-2 text-text-primary select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-primary font-semibold hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-sm text-danger bg-danger-subtle border border-danger/20 rounded-lg px-3 py-2.5"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={submitting}
                className="mt-2 h-12 rounded-lg text-sm font-semibold"
              >
                Sign in
              </Button>
            </form>

            <div className="mt-8 text-sm text-text-secondary text-center">
              Don&rsquo;t have an account?{' '}
              <Link
                to="/register"
                className="text-primary font-semibold hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
              >
                Create one
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-primary-subtle bg-surface shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-subtle border-b border-primary-subtle">
              <Info aria-hidden className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Demo accounts
              </span>
            </div>
            <ul className="px-4 py-3 space-y-2.5">
              <li className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Admin
                </span>
                <code className="font-mono text-xs text-text-primary break-all">
                  admin@monashclubs.org / Admin1234!
                </code>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Member
                </span>
                <code className="font-mono text-xs text-text-primary break-all">
                  parsa.aghajani@monashclubs.org / Member1234!
                </code>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-text-tertiary">
        By signing in you agree to the Terms of Use and Privacy Policy.
      </footer>
    </div>
  );
}
