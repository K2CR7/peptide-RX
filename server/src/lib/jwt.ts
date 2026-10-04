import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

const ACCESS_SECRET = requiredEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = requiredEnv("JWT_REFRESH_SECRET");

export interface AccessTokenPayload {
  sub: string; // userId
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

/**
 * The jti is what makes each refresh token a distinct credential.
 *
 * Without it the payload is just { sub }, and JWT's own iat/exp only move
 * once a second — so two tokens minted for the same user in the same second
 * were byte-identical. Rotation then silently did nothing (the "new" token
 * hashed to the row that had just been deleted), two devices signing in
 * together shared one credential, and revoking either revoked both.
 */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: randomUUID() }, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as AccessTokenPayload;
}
