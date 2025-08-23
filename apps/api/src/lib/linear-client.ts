import { LinearClient } from "@linear/sdk";

export type LinearWebhookPayload = {
  action: "create" | "update" | "remove";
  actor?: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  data: any;
  type: string;
  url?: string;
  webhookId: string;
  webhookTimestamp: number;
};

export type LinearTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type LinearOAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

type CreateLinearClientParams = {
  accessToken: string;
};

export function createLinearClient({ accessToken }: CreateLinearClientParams) {
  return new LinearClient({ accessToken });
}

export async function exchangeLinearCodeForToken({
  code,
  clientId,
  clientSecret,
  redirectUri,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<LinearOAuthTokenResponse> {
  const response = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Linear code for token: ${error}`);
  }

  const data = (await response.json()) as LinearOAuthTokenResponse;
  return data;
}

export async function refreshLinearToken({
  refreshToken,
  clientId,
  clientSecret,
}: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<LinearOAuthTokenResponse> {
  const response = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Linear token: ${error}`);
  }

  const data = (await response.json()) as LinearOAuthTokenResponse;
  return data;
}

export async function revokeLinearToken({
  accessToken,
  clientId,
  clientSecret,
}: {
  accessToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<void> {
  const response = await fetch("https://api.linear.app/oauth/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: accessToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to revoke Linear token: ${error}`);
  }
}

export async function verifyLinearWebhookSignature({
  body,
  signature,
  secret,
}: {
  body: string;
  signature: string;
  secret: string;
}): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const key = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signatureBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
    );

    return await crypto.subtle.verify("HMAC", cryptoKey, signatureBuffer, data);
  } catch {
    return false;
  }
}
