import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { isAuthenticated } from "@/lib/auth";
import { getAllProjects } from "@/lib/projects";

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

  const projects = await getAllProjects();
  return <AdminDashboard projects={projects} />;
}
