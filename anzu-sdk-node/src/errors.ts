export namespace errors {
  export enum ErrorCode {
    WebhookInvalidSignature = "webhook_invalid_signature",
    WebhookInvalidBody = "webhook_invalid_body",

    ApiClientMissingToken = "api_client_missing_token",
    ApiClientMissingWorkspaceId = "api_client_missing_workspace_id",
    ApiClientMissingEnvironmentId = "api_client_missing_environment_id",
    ApiClientRequestFailed = "api_client_request_failed",
  }

  export class SDKError extends Error {
    constructor(message: string, public code: ErrorCode) {
      super(message);
      this.name = "SDKError";
    }
  }
}
