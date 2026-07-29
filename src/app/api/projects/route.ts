import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { createProject, getAllProjects, getPublishedProjects } from "@/lib/projects";
import { validateProject } from "@/lib/validate";

/** Signed-in admins see drafts too; everyone else sees published projects. */
export async function GET() {
  const admin = await isAuthenticated();
  const projects = admin ? await getAllProjects() : await getPublishedProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
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

  const project = await createProject(result.value);

  // No cache to invalidate — the public pages render per request, so the new
  // project is live as soon as this returns.
  return NextResponse.json({ project }, { status: 201 });
}
