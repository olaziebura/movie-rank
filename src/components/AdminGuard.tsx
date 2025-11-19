import { auth0 } from "@/lib/auth/auth0";
import { isUserAdmin } from "@/lib/supabase/profiles";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import Link from "next/link";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function AdminGuard({ children, fallback }: AdminGuardProps) {
  let session: SessionData | null = null;
  let isAdmin = false;

  try {
    session = await auth0.getSession();
  } catch (error) {
    return error;
  }

  if (session?.user?.sub) {
    try {
      isAdmin = await isUserAdmin(session.user.sub);
    } catch (error) {
      return error;
    }
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-400 mb-6">
            Please log in to access this page.
          </p>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-2">
            This page is restricted to administrators only.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            If you believe you should have access, please contact support.
          </p>
          <div className="bg-neutral-800 rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-xs text-gray-400">
              <strong>User:</strong> {session.user.name || session.user.email}
              <br />
              <strong>Admin Status:</strong> {isAdmin ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
