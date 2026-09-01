import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { cropLabelToThermalSize } from "@/lib/labelCrop";

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Proxies the shipping label so downloads get a correct filename/extension —
 * DOTB serves labels without one, and cross-origin `download` attributes are
 * ignored by browsers, so we need to set Content-Disposition ourselves.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const original = url.searchParams.get("original") === "1";

  const order = await prisma.order.findUnique({ where: { id }, select: { title: true, shippingLabelUrl: true } });
  if (!order?.shippingLabelUrl) {
    return NextResponse.json({ error: "No shipping label for this order." }, { status: 404 });
  }

  const upstream = await fetch(order.shippingLabelUrl, { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not fetch the shipping label." }, { status: 502 });
  }

  // Labels are small (a few hundred KB) — buffering avoids streaming edge cases
  // (e.g. a client aborting the request mid-stream) taking down the connection.
  const upstreamBytes = await upstream.arrayBuffer();

  const contentType = upstream.headers.get("content-type")?.split(";")[0].trim() ?? "application/pdf";
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "pdf";
  const filename = `label-${slugify(order.title) || "order"}.${extension}`;

  // Crop PDFs down to a standard thermal-printer label size by default (DOTB's
  // full-page labels have a lot of surrounding content that isn't part of the
  // actual label — see src/lib/labelCrop.ts). `?original=1` bypasses this to
  // get DOTB's raw PDF back, e.g. if a particular carrier's layout doesn't
  // crop well. Never applies to image labels.
  let bytes = Buffer.from(upstreamBytes);
  if (contentType === "application/pdf" && !original) {
    try {
      bytes = Buffer.from(await cropLabelToThermalSize(upstreamBytes));
    } catch (err) {
      console.error("Failed to crop shipping label, serving the original PDF instead:", err);
    }
  }

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
