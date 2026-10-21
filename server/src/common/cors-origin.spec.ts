import { isCorsOriginAllowed } from './cors-origin';

describe('isCorsOriginAllowed', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCorsOrigins = process.env.CORS_ORIGINS;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalCorsOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = originalCorsOrigins;
    }
  });

  it('allows native clients without an Origin header', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGINS;

    expect(isCorsOriginAllowed(undefined)).toBe(true);
  });

  it('allows configured origins in production and rejects other origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://vendor.example,https://customer.example';

    expect(isCorsOriginAllowed('https://vendor.example')).toBe(true);
    expect(isCorsOriginAllowed('https://untrusted.example')).toBe(false);
  });

  it('allows local development origins only outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGINS;

    expect(isCorsOriginAllowed('http://localhost:19006')).toBe(true);

    process.env.NODE_ENV = 'production';
    expect(isCorsOriginAllowed('http://localhost:19006')).toBe(false);
  });
});
