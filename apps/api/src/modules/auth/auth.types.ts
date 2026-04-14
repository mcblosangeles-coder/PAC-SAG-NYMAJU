export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshInput = {
  refreshToken: string;
};

export type JwtTokenPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
};

export type AuthUserProfile = {
  id: string;
  email: string;
  fullName: string;
  initials: string | null;
  roles: string[];
  permissions: string[];
};
