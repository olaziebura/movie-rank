import { auth0 } from "@/lib/auth/auth0";
import { setUserAdminStatus, isUserAdmin } from "@/lib/supabase/profiles";
import {
  createApiResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";

export async function POST(request: Request) {
  try {
    const session = await auth0.getSession();

    if (!session?.user?.sub) {
      return createErrorResponse(
        "Authentication required",
        401,
        "AUTH_REQUIRED"
      );
    }

    const body = await request.json();
    const { targetUserId, isAdmin } = body;

    if (!targetUserId || typeof isAdmin !== "boolean") {
      return createErrorResponse(
        "targetUserId and isAdmin (boolean) are required",
        400,
        "INVALID_REQUEST"
      );
    }

    const currentUserIsAdmin = await isUserAdmin(session.user.sub);

    if (!currentUserIsAdmin) {
      const isDevelopment = process.env.NODE_ENV === "development";
      const allowFirstAdmin = process.env.ALLOW_FIRST_ADMIN === "true";

      if (!isDevelopment && !allowFirstAdmin) {
        return createErrorResponse(
          "Only administrators can modify admin status",
          403,
          "INSUFFICIENT_PERMISSIONS"
        );
      }
    }

    const result = await setUserAdminStatus(targetUserId, isAdmin);

    if (!result.success) {
      return createErrorResponse(
        "Failed to update admin status",
        500,
        "UPDATE_FAILED"
      );
    }

    return createApiResponse({
      success: true,
      message: `Admin status ${
        isAdmin ? "granted" : "revoked"
      } for user ${targetUserId}`,
      targetUserId,
      isAdmin,
    });
  } catch {
    return createErrorResponse("Internal server error", 500, "INTERNAL_ERROR");
  }
}

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session?.user?.sub) {
      return createErrorResponse(
        "Authentication required",
        401,
        "AUTH_REQUIRED"
      );
    }

    const isAdmin = await isUserAdmin(session.user.sub);

    return createApiResponse({
      userId: session.user.sub,
      isAdmin,
      user: {
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch {
    return createErrorResponse("Internal server error", 500, "INTERNAL_ERROR");
  }
}
