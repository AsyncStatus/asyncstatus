import type { Bindings } from './env';

export interface SlackOAuthResponse {
  ok: boolean;
  app_id: string;
  authed_user: {
    id: string;
  };
  team: {
    id: string;
    name: string;
  };
  bot_user_id: string;
  access_token: string;
  scope: string;
  token_type: string;
}

export async function exchangeSlackCode(
  code: string,
  redirectUri: string,
  env: Bindings
): Promise<SlackOAuthResponse> {
  const formData = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    code: code,
    redirect_uri: redirectUri,
  });

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange Slack code: ${response.statusText}`);
  }

  return await response.json();
}

export async function postMessage(
  channel: string,
  text: string,
  botToken: string,
  blocks?: any[]
) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel,
      text,
      ...(blocks && { blocks }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to post message: ${response.statusText}`);
  }

  return await response.json();
}

export async function verifySlackRequest(request: Request | any, env?: any): Promise<boolean> {
  try {
    // Handle HonoRequest objects by accessing the raw Request inside them
    const req = request.raw ? request.raw : request;

    // Get the signing secret from Bindings or fall back to a safe default
    const slackSigningSecret = env?.SLACK_SIGNING_SECRET || "fc458ec4c3423715890a1a38de1cc254";

    // Check if signing secret is available
    if (!slackSigningSecret || slackSigningSecret.trim() === '') {
      console.error('Slack signing secret is missing or empty');
      return false;
    }

    const slackSignature = req.headers.get('x-slack-signature');
    const timestamp = req.headers.get('x-slack-request-timestamp');

    if (!slackSignature || !timestamp) {
      console.error('Missing Slack signature or timestamp header');
      return false;
    }
    return true;

    // TODO fix the verification
    // // Check if the request is not older than 5 minutes
    // const currentTime = Math.floor(Date.now() / 1000);
    // if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    //   return false;
    // }


    // // Clone the request so we can read the body
    // const clonedRequest = req.clone();
    // let body;
    // try {
    //   // Get request body
    //   body = await clonedRequest.text();
    // } catch (bodyError) {
    //   console.error('Error reading request body:', bodyError);
    //   // Try an alternative approach for Hono requests
    //   if (request.bodyCache && typeof request.bodyCache.text === 'string') {
    //     body = request.bodyCache.text;
    //     console.log('Using cached body from request.bodyCache');
    //   } else {
    //     return false;
    //   }
    // }
    // console.log('Request body:', body.text());

    // try {
    //   // Create the signature base string
    //   const baseString = `v0:${timestamp}:${body}`;
  
    //   // Convert signing secret to an ArrayBuffer
    //   const encoder = new TextEncoder();
    //   const key = await crypto.subtle.importKey(
    //     'raw',
    //     encoder.encode(slackSigningSecret),
    //     { name: 'HMAC', hash: 'SHA-256' },
    //     false,
    //     ['sign']
    //   );
      
    //   // Generate the signature
    //   const mac = await crypto.subtle.sign(
    //     'HMAC',
    //     key,
    //     encoder.encode(baseString)
    //   );
  
    //   // Convert to hex string
    //   const computedSignature = `v0=${Array.from(new Uint8Array(mac))
    //     .map(b => b.toString(16).padStart(2, '0'))
    //     .join('')}`;
  
    //   // Compare signatures (constant-time comparison would be ideal but this is simpler)
    //   return computedSignature === slackSignature;
    // } catch (cryptoError) {
    //   console.error('Error during signature verification:', cryptoError);
    //   return false;
    // }
  } catch (error) {
    console.error('Error verifying Slack request:', error);
    return false;
  }
}
