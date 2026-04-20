import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import type { Role } from '../api/types';

// TODO(ethan): Add form-validation polish on the register page (inline field
// errors, password strength meter, debounced email-uniqueness check).

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
  const [role, setRole] = useState<Role>('MEMBER');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await register({ name: name.trim(), email: email.trim(), password, role });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      setTopError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-page flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
          <p className="text-base text-muted mt-1">Join your club&rsquo;s task workspace.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Field label="Password" required error={errors.password} hint="At least 8 characters" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              invalid={!!errors.password}
            />
          </Field>
          <Field label="Role" htmlFor="role">
            <Select id="role" value={role} onChange={e => setRole(e.target.value as Role)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          {topError && (
            <div className="text-sm text-error bg-primary-soft border border-error/20 rounded-md p-3">
              {topError}
            </div>
          )}
          <Button type="submit" loading={submitting} className="mt-2">
            Create account
          </Button>
        </form>
        <div className="mt-6 text-sm text-muted text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
