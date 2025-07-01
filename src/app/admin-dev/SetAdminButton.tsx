"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SetAdminButtonProps {
  userId: string;
  isCurrentlyAdmin: boolean;
}

export function SetAdminButton({
  userId,
  isCurrentlyAdmin,
}: SetAdminButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSetAdmin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/set-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: userId,
          isAdmin: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "Admin status granted successfully!",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to grant admin status",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSetAdmin}
        disabled={loading || isCurrentlyAdmin}
        variant={isCurrentlyAdmin ? "secondary" : "default"}
      >
        {loading
          ? "Granting Admin..."
          : isCurrentlyAdmin
          ? "Already Admin"
          : "Grant Admin Access"}
      </Button>

      {result && (
        <div
          className={`p-3 rounded ${
            result.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
