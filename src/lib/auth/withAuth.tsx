import { auth0 } from "@/lib/auth/auth0";
import { NextPage } from "next";

export function withAuth<P extends object>(
  Page: NextPage<P & { session?: unknown }>
) {
  return async function ProtectedPage(props: P) {
    const session = await auth0.getSession();

    if (!session) {
      return (
        <main>
          <h1>Access Denied</h1>
          <a href="/auth/login">Log in</a>
        </main>
      );
    }

    try {
    } catch (error) {
      console.error("Failed to upsert profile:", error);
    }

    return <Page {...props} session={session} />;
  };
}
