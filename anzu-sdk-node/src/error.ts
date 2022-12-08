export enum ErrorCode {
  WebhookInvalidSignature = "webhook_invalid_signature",
  WebhookInvalidBody = "webhook_invalid_body",
}

export class SDKError extends Error {
  constructor(message: string, public code: ErrorCode) {
    super(message);
    this.name = "SDKError";
  }
}
