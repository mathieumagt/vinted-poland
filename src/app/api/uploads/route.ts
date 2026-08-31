import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData();
  const file = form.get("file");
  const folder = form.get("folder");

  if (!(file instanceof File) || (folder !== "photos" && folder !== "labels")) {
    return NextResponse.json({ error: "Missing file or invalid folder." }, { status: 400 });
  }

  try {
    const url = await uploadFile(file, folder);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 400 }
    );
  }
}
