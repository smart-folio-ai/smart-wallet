// `useAuth` (src/hooks/useAuth.ts) runs `jwtDecode` on `access_token` before
// treating a session as authenticated — an opaque string like 'fake-token'
// throws, `isAuthenticated` stays false, and every protected route silently
// bounces back to `/`. Fixture tokens must be JWT-shaped (three base64url
// segments), even though nothing here verifies the signature.
export function createFakeAccessToken(
  payload: Record<string, unknown> = {},
): string {
  const base64url = (value: unknown): string =>
    Buffer.from(JSON.stringify(value))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const header = {alg: 'HS256', typ: 'JWT'};
  const body = {
    userId: 'e2e-user',
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    ...payload,
  };

  return `${base64url(header)}.${base64url(body)}.e2e-fake-signature`;
}
