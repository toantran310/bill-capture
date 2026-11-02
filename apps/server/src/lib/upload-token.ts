export interface SignUploadOptions {
  /** Destination folder the signature will be scoped to. Defaults to the root. */
  folder?: string;
  /** Signature lifetime in seconds. The server clamps this to [1, 3600]. Default 300. */
  expiresIn?: number;
  /** Overrides the default User-Agent sent with the request. Sent as a header, not in the body. */
  userAgent?: string;
}

/**
 * Cloudflare Workers, Deno Deploy and Bun send no User-Agent on outbound
 * `fetch`, and edge WAFs (including Openinary Cloud's) answer a UA-less
 * request with an HTML block page, which surfaces here as a confusing
 * "Failed to sign upload" rather than a blocked request. Always send one.
 */
const DEFAULT_USER_AGENT = "openinary-upload-token/1.0.0";

export interface SignedUpload {
  signature: string;
  /** Unix timestamp (seconds) after which the signature is no longer valid. */
  expires: number;
  folder: string;
}

/**
 * Requests a presigned upload signature from your Openinary instance.
 *
 * @param baseUrl Your Openinary API URL, e.g. https://media.example.com.
 * @param apiKey An Openinary API key (Authorization: Bearer).
 */
export async function signUpload(
  baseUrl: string,
  apiKey: string,
  options: SignUploadOptions = {},
): Promise<SignedUpload> {
  const { userAgent = DEFAULT_USER_AGENT, ...params } = options;

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/upload/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": userAgent,
    },
    body: JSON.stringify(params),
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !body?.success) {
    throw new Error(
      body?.error ?? `Failed to sign upload (HTTP ${res.status})`,
    );
  }

  return {
    signature: body.signature,
    expires: body.expires,
    folder: body.folder,
  };
}
