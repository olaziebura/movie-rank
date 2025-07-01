import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      sub: session.user?.sub || session.user?.id,
      name: session.user?.name,
      email: session.user?.email,
      picture: session.user?.picture,
    });
  } catch (error) {
    console.error("Error fetching user session:", error);
    return NextResponse.json(null);
  }
}
