import { auth0 } from "@/lib/auth/auth0";
import { getProfile } from "@/lib/supabase/profiles";
import { redirect } from "next/navigation";
import { SetAdminButton } from "./SetAdminButton";
import Link from "next/link";

export default async function AdminDevPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  const session = await auth0.getSession();

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Development Utility</h1>
        <p>Please log in to use this utility.</p>
        <Link href="/api/auth/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  const profile = await getProfile(session.user.sub);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Development Utility</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          <strong>⚠️ Development Only:</strong> This page is only available in
          development mode.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Current User Info</h2>
        <div className="space-y-2">
          <p>
            <strong>User ID:</strong> {session.user.sub}
          </p>
          <p>
            <strong>Name:</strong> {session.user.name}
          </p>
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          <p>
            <strong>Admin Status:</strong>
            <span
              className={`ml-2 px-2 py-1 rounded text-sm ${
                profile?.admin
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {profile?.admin ? "Admin" : "Not Admin"}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Make Current User Admin</h2>
        <p className="text-gray-600 mb-4">
          Use this button to grant admin privileges to the currently logged-in
          user. This is useful for initial setup.
        </p>

        <SetAdminButton
          userId={session.user.sub}
          isCurrentlyAdmin={!!profile?.admin}
        />
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Panel Access</h2>
        <p className="text-gray-600 mb-4">
          If you have admin privileges, you can access the admin-only sync
          database page.
        </p>
        <a
          href="/sync-database"
          className={`inline-block px-4 py-2 rounded ${
            profile?.admin
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {profile?.admin ? "Access Admin Panel" : "Admin Access Required"}
        </a>
      </div>
    </div>
  );
}
