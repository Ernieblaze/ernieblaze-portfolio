import type { Metadata } from "next";

import { AdminConfigError } from "@/components/admin/config-error";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { isAuthenticated } from "@/lib/auth";
import { getAllProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Reading the session cookie makes this route dynamic, so the dashboard is
  // never prerendered or cached.
  if (!(await isAuthenticated())) {
    return <AdminLogin />;
  }

  // Unlike the public site, the dashboard says what's broken rather than
  // rendering an empty list — an empty list here is indistinguishable from
  // "your projects are gone", which is the wrong thing to imply.
  let projects: Project[];
  try {
    projects = await getAllProjects();
  } catch (error) {
    return (
      <AdminConfigError
        message={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  return <AdminDashboard projects={projects} />;
}
