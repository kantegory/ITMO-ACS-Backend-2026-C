import { type AuthClientContext, type AuthClientOptions, createAuthClientContext } from "./api/authClientContext.js";
import { login, type LoginOptions, logout, type LogoutOptions, refresh, type RefreshOptions, register, type RegisterOptions } from "./api/authClientOperations.js";

export class AuthClient {
  #context: AuthClientContext
  constructor(endpoint: string, options?: AuthClientOptions) {
    this.#context = createAuthClientContext(endpoint, options);

  }
  async register(
    login: string,
    email: string,
    password: string,
    confPassword: string,
    options?: RegisterOptions,
  ) {
    return register(
      this.#context,
      login,
      email,
      password,
      confPassword,
      options
    );
  };
  async login(login: string, password: string, options?: LoginOptions) {
    return login(this.#context, login, password, options);
  };
  async logout(authorization: string, options?: LogoutOptions) {
    return logout(this.#context, authorization, options);
  };
  async refresh(
    body: {
        refreshToken: string;
      },
    options?: RefreshOptions,
  ) {
    return refresh(this.#context, body, options);
  }
}
