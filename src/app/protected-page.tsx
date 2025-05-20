import { withAuth } from "@/lib/auth/withAuth";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { NextPage } from "next";

interface ProtectedPageProps {
  session?: SessionData | null; // Change type to be compatible with withAuth
}

const ProtectedPage: NextPage<ProtectedPageProps> = ({ session }) => {
  if (!session) return null;

  return (
    <main>
      <h1>Welcome, {session.user.name}!</h1>
      <p>This is a protected page.</p>
    </main>
  );
};

export default withAuth(ProtectedPage);
