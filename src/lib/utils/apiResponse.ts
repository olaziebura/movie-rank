/**
 * Standardized API response utilities for the MovieRank application
 * Provides consistent response formats and helper functions
 */

import { NextResponse } from "next/server";

// Convenience functions for creating API responses
export function createApiResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}
