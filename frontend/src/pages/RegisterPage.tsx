import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { cn } from '../lib/cn';
import { scorePassword, type PasswordStrength } from '../lib/passwordStrength';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (password.length < 8) next.password = 'At least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTopError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password }, remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      setTopError(msg);
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-h2 font-semibold text-text-primary">Create your account</h1>
            <p className="text-sm text-text-secondary mt-1">
              Join your club&rsquo;s task workspace.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Full name" required error={errors.name} htmlFor="name">
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                invalid={!!errors.name}
              />
            </Field>
            <Field label="Email" required error={errors.email} htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                invalid={!!errors.email}
              />
            </Field>
            <Field
              label="Password"
              required
              error={errors.password}
              hint="At least 8 characters"
              htmlFor="password"
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  invalid={!!errors.password}
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
              {password.length > 0 && (
                <PasswordStrengthMeter strength={strength.label} score={strength.score} />
              )}
            </Field>
            <label className="inline-flex items-center gap-2 text-sm text-text-primary select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
              />
              Remember me
            </label>

            {topError && (
              <div
                role="alert"
                className="text-sm text-danger bg-danger-subtle border border-danger/20 rounded-md px-3 py-2"
              >
                {topError}
              </div>
            )}
            <Button type="submit" loading={submitting} className="mt-2">
              Create account
            </Button>
          </form>
          <div className="mt-6 text-sm text-text-secondary text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PasswordStrengthMeter({
  strength,
  score,
}: {
  strength: PasswordStrength | 'empty';
  score: 0 | 1 | 2 | 3;
}) {
  const fillTone =
    strength === 'strong'
      ? 'bg-success'
      : strength === 'fair'
        ? 'bg-warning'
        : 'bg-danger';
  const label = strength === 'empty' ? '' : strength.charAt(0).toUpperCase() + strength.slice(1);
  return (
    <div className="mt-2" data-testid="password-strength">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full',
              i < score ? fillTone : 'bg-border-default',
            )}
          />
        ))}
      </div>
      {label && (
        <span
          className="text-xs text-text-tertiary mt-1 inline-block"
          data-testid="password-strength-label"
        >
          Strength: {label}
        </span>
      )}
    </div>
  );
}
