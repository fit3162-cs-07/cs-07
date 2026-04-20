import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';

// TODO(ruizhi): Polish login page animations and add a "Remember me" checkbox.

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('admin@monash.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Sign-in failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-page flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
          <p className="text-base text-muted mt-1">Manage tasks for your Monash club.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && (
            <div className="text-sm text-error bg-primary-soft border border-error/20 rounded-md p-3">
              {error}
            </div>
          )}
          <Button type="submit" loading={submitting} className="mt-2">
            Sign in
          </Button>
        </form>
        <div className="mt-6 text-sm text-muted text-center">
          Don&rsquo;t have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </div>
        <div className="mt-6 p-3 bg-primary-soft rounded-md text-sm text-muted">
          <div className="font-semibold text-ink mb-1">Seed accounts</div>
          admin@monash.edu / admin123
          <br />
          member1@monash.edu / member123
        </div>
      </Card>
    </div>
  );
}
