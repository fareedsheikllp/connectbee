import { auth } from "../../lib/auth.js";
import { redirect } from "next/navigation";
import Sidebar from "../../components/dashboard/Sidebar";
import TopBar from "../../components/dashboard/TopBar";
import IdleTimeout from "@/components/IdleTimeout";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <IdleTimeout minutes={1} />
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}