export type PasswordStrength = 'weak' | 'fair' | 'strong';

export interface PasswordScore {
  score: 0 | 1 | 2 | 3;
  label: PasswordStrength | 'empty';
}

export function scorePassword(pw: string): PasswordScore {
  if (!pw) return { score: 0, label: 'empty' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score >= 3) return { score: 3, label: 'strong' };
  if (score === 2) return { score: 2, label: 'fair' };
  return { score: 1, label: 'weak' };
}
