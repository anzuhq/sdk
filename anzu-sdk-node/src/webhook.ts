import { createHmac } from "crypto";
import { ErrorCode, SDKError } from "./error";
import { IEvent } from "./event";

export interface IWebhookDeliveryContent extends IEvent {
  // event scope
  scope: {
    workspaceId: string;
    environmentId: string;
  };

  // delivery details
  delivery: {
    webhookId: string;
    deliveryId: string;
  };
}

/**
 * Verify incoming webhook request
 * @param body
 * @param signature
 * @param webhookSecret secret found on webhook details page
 * @returns
 */
export function constructEvent(
  body: Buffer,
  signature: string,
  webhookSecret: string
): IWebhookDeliveryContent {
  const rawBody = body.toString("utf8");

  validateSignature(signature, rawBody, webhookSecret);

  try {
    const parsed = JSON.parse(rawBody);
    return parsed;
  } catch (err) {
    throw new SDKError("Invalid JSON body", ErrorCode.WebhookInvalidBody);
  }
}

/**
 * Validates signature with request body and secret
 *
 * Uses timestamp and sig from signature value
 *
 * @param signature full signature header including ts, v, and sig
 * @param requestBody
 * @param secret
 */
function validateSignature(
  signature: string,
  requestBody: string,
  secret: string
) {
  const params = new URLSearchParams(signature);

  const ts = params.get("ts");
  const version = params.get("v");
  const sig = params.get("sig");

  if (!ts || !version || !sig) {
    throw new SDKError("Invalid signature", ErrorCode.WebhookInvalidSignature);
  }

  if (version !== "1") {
    throw new SDKError("Invalid signature", ErrorCode.WebhookInvalidSignature);
  }

  const expectedSig = getHmac(secret, ts, requestBody);

  if (sig !== expectedSig) {
    throw new SDKError("Invalid signature", ErrorCode.WebhookInvalidSignature);
  }
}

function getHmac(secret: string, ts: string, requestBody: string) {
  const hmac = createHmac("sha256", secret);

  const signedPayload = `${ts}.${requestBody}`;
  hmac.update(signedPayload);

  return hmac.digest("hex");
}
