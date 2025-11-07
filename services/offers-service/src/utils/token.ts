import * as jose from 'jose';

const SECRET = process.env.OFFER_JWT_SECRET || 'default-offer-secret-key-change-in-production';

export interface TokenPayload {
  offerId: string;
  tenantId: string;
  expiresAt: number;
}

export async function generateOfferToken(offerId: string, tenantId: string): Promise<string> {
  const secret = new TextEncoder().encode(SECRET);
  
  // Token valid for 30 days
  const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
  
  const token = await new jose.SignJWT({ offerId, tenantId, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  
  return token;
}

export async function verifyOfferToken(token: string): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(SECRET);
  
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    
    return {
      offerId: payload.offerId as string,
      tenantId: payload.tenantId as string,
      expiresAt: payload.expiresAt as number,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

