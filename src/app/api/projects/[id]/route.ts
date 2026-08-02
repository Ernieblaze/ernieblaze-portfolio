import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { deleteProject, updateProject } from "@/lib/projects";
import { revalidatePublicPages } from "@/lib/revalidate";
import { validateProject } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = validateProject(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { id } = await params;
  const project = await updateProject(id, result.value);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  revalidatePublicPages(project.slug);

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const project = await deleteProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // Refreshes the listing and drops the now-404 case-study page.
  revalidatePublicPages(project.slug);

  return NextResponse.json({ deleted: project.id });
}
