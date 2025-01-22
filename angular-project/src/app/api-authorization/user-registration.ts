export interface UserRegistration {
  email: string,
  password: string,
  confirmPassword: string,
  captchaToken: string
}

export interface RegistrationResponse {
  isSuccessfulRegistration: boolean;
  errors: string[];
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  isAuthSuccessful: boolean;
  errorMessage: string;
  token: string;
  username: string;
}
