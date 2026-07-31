import { AwsClient } from "aws4fetch";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET = process.env.R2_BUCKET;

let client: AwsClient | null = null;
function getClient(): AwsClient {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured");
  }
  client ??= new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  return client;
}

function endpoint(): string {
  if (!accountId) throw new Error("R2_ACCOUNT_ID is not configured");
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

/**
 * Returns a presigned PUT URL the mobile app can upload directly to, and the
 * eventual public GET URL to store on the Checkin record — keeps large photo
 * bytes off our API server entirely.
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!R2_BUCKET) throw new Error("R2_BUCKET is not configured");
  const url = new URL(`${endpoint()}/${R2_BUCKET}/${key}`);
  url.searchParams.set("X-Amz-Expires", "300");
  const signed = await getClient().sign(
    new Request(url, { method: "PUT", headers: { "content-type": contentType } }),
    { aws: { signQuery: true } },
  );
  return {
    uploadUrl: signed.url,
    // Requires the bucket's public access (R2.dev subdomain or custom domain)
    // to be enabled in the Cloudflare dashboard — not done via this API.
    publicUrl: `${endpoint()}/${R2_BUCKET}/${key}`,
  };
}
