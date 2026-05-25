import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
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
    <div className="auth-bg auth-pattern min-h-full relative flex flex-col">
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-surface rounded-2xl shadow-2xl ring-1 ring-border-default/60 px-8 py-10 sm:px-10 sm:py-12">
            <div className="flex justify-center mb-6">
              <Logo size="md" />
            </div>
            <div className="text-center mb-8">
              <h1 className="text-h1 font-bold text-text-primary tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-text-secondary mt-2">
                Join your club&rsquo;s task workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <RegisterField
                id="name"
                label="Full name"
                autoComplete="name"
                placeholder="Your full name"
                value={name}
                onChange={setName}
                error={errors.name}
              />
              <RegisterField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@monashclubs.org"
                value={email}
                onChange={setEmail}
                error={errors.email}
              />

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-text-primary mb-2"
                >
                  Password <span className="text-text-tertiary font-normal">(required)</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    className={cn(
                      'block w-full h-12 pl-4 pr-12 text-sm text-text-primary bg-surface border rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-DEFAULT ease-DEFAULT',
                      errors.password
                        ? 'border-danger focus:border-danger'
                        : 'border-border-strong hover:border-text-tertiary focus:border-primary',
                    )}
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
                {errors.password ? (
                  <p className="text-xs text-danger mt-1">{errors.password}</p>
                ) : (
                  <p className="text-xs text-text-tertiary mt-1">At least 8 characters</p>
                )}
                {password.length > 0 && (
                  <PasswordStrengthMeter
                    strength={strength.label}
                    score={strength.score}
                  />
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-text-primary select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
                />
                Remember me
              </label>

              {topError && (
                <div
                  role="alert"
                  className="text-sm text-danger bg-danger-subtle border border-danger/20 rounded-lg px-3 py-2.5"
                >
                  {topError}
                </div>
              )}
              <Button
                type="submit"
                loading={submitting}
                className="mt-1 h-11 rounded-lg text-sm font-semibold"
              >
                Create account
              </Button>
            </form>

            <div className="mt-6 text-sm text-text-secondary text-center">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary font-semibold hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-text-tertiary">
        By signing up you agree to the Terms of Use and Privacy Policy.
      </footer>
    </div>
  );
}

interface RegisterFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange(value: string): void;
  error?: string;
}

function RegisterField({
  id,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  onChange,
  error,
}: RegisterFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text-primary mb-2">
        {label} <span className="text-text-tertiary font-normal">(required)</span>
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          'block w-full h-12 px-4 text-sm text-text-primary bg-surface border rounded-lg placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-DEFAULT ease-DEFAULT',
          error
            ? 'border-danger focus:border-danger'
            : 'border-border-strong hover:border-text-tertiary focus:border-primary',
        )}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
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
