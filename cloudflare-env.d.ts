declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NEWSROOM_OWNER_EMAIL?: string;
    PUBLIC_SITE_URL?: string;
    PUBLIC_INDEXING?: string;
  }
}
