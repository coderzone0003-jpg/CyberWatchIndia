export const resolveApiUrl = () => {
  const configured = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  if (
    typeof window !== 'undefined' &&
    !/localhost|127\.0\.0\.1/.test(window.location.hostname)
  ) {
    return '';
  }

  return 'http://localhost:5000';
};

export const API_URL = resolveApiUrl();

export const IS_PRODUCTION_HOST =
  typeof window !== 'undefined' &&
  !/localhost|127\.0\.0\.1/.test(window.location.hostname);
