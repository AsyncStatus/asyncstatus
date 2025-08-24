import type { KnownBlock } from "@slack/types";
import type { ChatPostMessageArguments, WebClient } from "@slack/web-api";

type PostMessageArgs = {
  channel: string;
  text: string;
  blocks?: Array<Record<string, unknown>>;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
};

const MAX_TEXT_LENGTH = 3000; // Slack mrkdwn/plain_text object limit
const SAFE_SLICE = 2900; // leave headroom for ellipsis

export function sanitizeSlackMrkdwn(input: string): string {
  if (!input) return "";
  // Normalize CR/CRLF to LF first
  const normalized = input.replace(/\r\n?/g, "\n");
  // Remove control chars except \n and \t, and strip zero-width characters
  let result = "";
  for (const ch of normalized) {
    const code = ch.charCodeAt(0);
    if (code < 32 && ch !== "\n" && ch !== "\t") continue;
    if (code === 0x200b || code === 0x200c || code === 0x200d || code === 0xfeff) continue;
    result += ch;
  }
  if (result.length > SAFE_SLICE) {
    result = `${result.slice(0, SAFE_SLICE)}…`;
  }
  return result;
}

type MaybeTextBlock = { text?: { type?: unknown; text?: unknown } };
type TextObject = { type: "mrkdwn" | "plain_text"; text: string };

function sanitizeBlocks(blocks: Array<Record<string, unknown>>): KnownBlock[] {
  const sanitized: KnownBlock[] = [];
  for (const block of blocks.slice(0, 50)) {
    const b: Record<string, unknown> = { ...block };
    // Section blocks are what we use; sanitize text fields if present
    const maybe = b as MaybeTextBlock;
    const text = maybe.text;
    if (text && typeof text === "object") {
      const typeVal = text.type;
      const value = text.text;
      if (typeof value === "string") {
        (b as MaybeTextBlock).text = {
          type: typeVal === "plain_text" ? "plain_text" : "mrkdwn",
          text: sanitizeSlackMrkdwn(value),
        } as TextObject;
      }
    }
    sanitized.push(b as unknown as KnownBlock);
  }
  return sanitized;
}

function isSlackError(err: unknown, code: string): boolean {
  const e = err as { data?: { error?: unknown }; message?: unknown } | undefined;
  const fromData = typeof e?.data?.error === "string" && e.data.error === code;
  const fromMessage = typeof e?.message === "string" && (e.message as string).includes(code);
  return fromData || fromMessage;
}

export async function postSlackMessageSafely(
  client: WebClient,
  args: PostMessageArgs,
): Promise<void> {
  const base = {
    channel: args.channel,
    unfurl_links: args.unfurl_links ?? false,
    unfurl_media: args.unfurl_media ?? false,
  } as const;

  const safeText = sanitizeSlackMrkdwn(args.text).slice(0, MAX_TEXT_LENGTH);
  const safeBlocks = args.blocks ? sanitizeBlocks(args.blocks) : undefined;

  try {
    const payload: ChatPostMessageArguments = {
      channel: base.channel,
      text: safeText,
      unfurl_links: base.unfurl_links,
      unfurl_media: base.unfurl_media,
      ...(safeBlocks ? { blocks: safeBlocks } : {}),
    };
    await client.chat.postMessage(payload);
    return;
  } catch (err) {
    // If blocks are invalid, retry with text-only
    if (isSlackError(err, "invalid_blocks") || isSlackError(err, "invalid_arguments")) {
      try {
        const payload: ChatPostMessageArguments = {
          channel: base.channel,
          text: safeText,
          unfurl_links: base.unfurl_links,
          unfurl_media: base.unfurl_media,
        };
        await client.chat.postMessage(payload);
        return;
      } catch (err2) {
        // fall through to final handling
        if (isSlackError(err2, "msg_too_long")) {
          const shorter = safeText.slice(0, SAFE_SLICE) + "…";
          const payload: ChatPostMessageArguments = {
            channel: base.channel,
            text: shorter,
            unfurl_links: base.unfurl_links,
            unfurl_media: base.unfurl_media,
          };
          await client.chat.postMessage(payload);
          return;
        }
        throw err2;
      }
    }

    // If message is too long, truncate and retry
    if (isSlackError(err, "msg_too_long")) {
      const shorter = safeText.slice(0, SAFE_SLICE) + "…";
      const payload: ChatPostMessageArguments = {
        channel: base.channel,
        text: shorter,
        unfurl_links: base.unfurl_links,
        unfurl_media: base.unfurl_media,
      };
      await client.chat.postMessage(payload);
      return;
    }

    // Unknown error: rethrow
    throw err;
  }
}
