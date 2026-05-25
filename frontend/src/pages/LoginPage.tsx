import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
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
    <div className="auth-bg min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div
            aria-hidden
            className="w-9 h-9 rounded-lg bg-primary text-text-on-primary flex items-center justify-center text-lg font-semibold shadow-sm"
          >
            M
          </div>
          <span className="text-h3 font-semibold text-text-primary tracking-tight">
            Monash Club Tasks
          </span>
        </div>
        <Card className="shadow-md">
          <div className="mb-6">
            <h1 className="text-h2 font-semibold text-text-primary">Sign in</h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage tasks for your Monash club.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-DEFAULT ease-DEFAULT"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-text-primary select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgot}
                className="text-sm text-primary font-medium hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm text-danger bg-danger-subtle border border-danger/20 rounded-md px-3 py-2"
              >
                {error}
              </div>
            )}
            <Button type="submit" loading={submitting} className="mt-2">
              Sign in
            </Button>
          </form>
          <div className="mt-6 text-sm text-text-secondary text-center">
            Don&rsquo;t have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-medium hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
            >
              Create one
            </Link>
          </div>
        </Card>

        <div className="mt-4 rounded-lg border border-border-default bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-subtle border-b border-border-default">
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4 text-primary shrink-0"
            >
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 5v3.5M8 11h.01" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Demo accounts
            </span>
          </div>
          <ul className="px-4 py-3 space-y-2.5">
            <li className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Admin
              </span>
              <code className="font-mono text-xs text-text-primary break-all">
                admin@monashclubs.org / Admin1234!
              </code>
            </li>
            <li className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Member
              </span>
              <code className="font-mono text-xs text-text-primary break-all">
                parsa.aghajani@monashclubs.org / Member1234!
              </code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
