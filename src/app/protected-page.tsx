import { auth0 } from "@/lib/auth/auth0";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Protected Page</h1>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">
          Welcome, {session.user.name}!
        </h2>
        <p className="text-gray-700 mb-4">
          This is a protected page that requires authentication to access.
        </p>
        <div className="space-y-2">
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          <p>
            <strong>User ID:</strong> {session.user.sub}
          </p>
        </div>
      </div>
    </div>
  );
}
