export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshInput = {
  refreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type JwtTokenPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
};

export type RefreshJwtTokenPayload = {
  sub: string;
  jti: string;
  family: string;
  type: "refresh";
  iat?: number;
  exp?: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
};

export type IssuedRefreshToken = {
  token: string;
  payload: RefreshJwtTokenPayload;
  expiresAt: Date;
};

export type AuthUserProfile = {
  id: string;
  email: string;
  fullName: string;
  initials: string | null;
  roles: string[];
  permissions: string[];
};
