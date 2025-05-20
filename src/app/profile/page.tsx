import { auth0 } from "@/lib/auth/auth0";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) return <p>Please log in to see your profile.</p>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <Image width={10} height={10} src={user.picture || ""} alt="Profile" />
    </div>
  );
}
