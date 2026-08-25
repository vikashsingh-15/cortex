export class InsufficientCreditsError extends Error {
  statusCode: number;
  code: string;

  constructor(message = "Insufficient credits") {
    super(message);
    this.statusCode = 400;
    this.code = "INSUFFICIENT_CREDITS";
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}
