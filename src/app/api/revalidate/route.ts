import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

/**
 * Sanity → webhook → here. When an editor publishes, the matching cached content is dropped so the change shows on the very next page view.
 * Secure it with SANITY_REVALIDATE_SECRET (same value in the webhook's "Secret" field). Without the secret every request is refused.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, error: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret);
    if (!isValidSignature) return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    const type = body?._type;
    if (!type || !["siteSettings", "navigation", "homePage", "page"].includes(type)) return NextResponse.json({ ok: true, ignored: type ?? null });
    revalidateTag(`sanity:${type}`, { expire: 0 }); // blocking refresh: the next visitor already sees the edit
    return NextResponse.json({ ok: true, revalidated: `sanity:${type}` });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
