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

  const [email, setEmail] = useState('admin@monash.edu');
  const [password, setPassword] = useState('admin123');
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
    <div className="min-h-full bg-surface-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div
            aria-hidden
            className="w-8 h-8 rounded-md bg-primary text-text-on-primary flex items-center justify-center text-base font-semibold"
          >
            M
          </div>
          <span className="text-h3 font-semibold text-text-primary tracking-tight">
            Monash Club Tasks
          </span>
        </div>
        <Card>
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
        <div className="mt-4 px-4 py-3 bg-surface border border-border-default rounded-md text-sm text-text-secondary">
          <div className="font-medium text-text-primary mb-1">Seed accounts</div>
          <code className="font-mono text-xs">admin@monash.edu / admin123</code>
          <br />
          <code className="font-mono text-xs">member1@monash.edu / member123</code>
        </div>
      </div>
    </div>
  );
}
