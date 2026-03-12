const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  const normalizedEmail = email?.trim();
  if (!normalizedEmail) return true;
  return SIMPLE_EMAIL_REGEX.test(normalizedEmail);
}

export function getEmailValidity(email) {
  const normalizedEmail = email?.trim();
  if (!normalizedEmail) return 'empty';
  return isValidEmail(normalizedEmail) ? 'valid' : 'invalid';
}

