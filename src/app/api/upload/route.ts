import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { MAX_IMAGES_PER_PROJECT, saveUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }

  if (files.length > MAX_IMAGES_PER_PROJECT) {
    return NextResponse.json(
      { error: `Upload up to ${MAX_IMAGES_PER_PROJECT} images at a time.` },
      { status: 400 },
    );
  }

  const urls: string[] = [];
  for (const file of files) {
    const result = await saveUpload(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    urls.push(result.url);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
