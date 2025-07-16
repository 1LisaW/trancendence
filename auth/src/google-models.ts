export interface GoogleAuthRequestBody {
  idToken: string;
}

export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export interface GoogleAuthResponse {
  token?: string;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  needsUsername?: boolean;
  googleUser?: {
    sub: string; // Google user ID
    email: string;
    name: string;
    picture?: string;
  };
}

export interface GoogleUserDTO {
  id: number;
  name: string;
  email: string;
  google_id?: string;
  avatar?: string;
  password?: string;
}
 