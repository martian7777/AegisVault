export class DecryptionError extends Error {
  constructor(message = 'Decryption failed.') {
    super(message);
    this.name = 'DecryptionError';
  }
}

/** Thrown when the local auth verifier does not match — wrong password and/or Secret Key. */
export class AuthenticationFailedError extends Error {
  constructor(message = 'Authentication failed.') {
    super(message);
    this.name = 'AuthenticationFailedError';
  }
}
