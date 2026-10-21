const localOrigin =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

export const isCorsOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;

  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((configuredOrigin) => configuredOrigin.trim())
    .filter(Boolean);

  return (
    configuredOrigins.includes(origin) ||
    (process.env.NODE_ENV !== 'production' && localOrigin.test(origin))
  );
};
