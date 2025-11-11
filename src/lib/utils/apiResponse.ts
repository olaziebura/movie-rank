/**
 * Standardized API response utilities for the MovieRank application
 * Provides consistent response formats and helper functions
 */

import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ResponseHelper {
  /**
   * Create a successful API response
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: ApiSuccessResponse<T>["meta"],
    status: number = 200
  ): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      ...(message && { message }),
      ...(meta && { meta }),
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a successful API response with pagination meta
   */
  static successWithPagination<T>(
    data: T,
    page: number,
    limit: number,
    total: number,
    message?: string,
    status: number = 200
  ): NextResponse<ApiSuccessResponse<T>> {
    const totalPages = Math.ceil(total / limit);

    return ResponseHelper.success(
      data,
      message,
      { page, limit, total, totalPages },
      status
    );
  }

  /**
   * Create an error API response
   */
  static error(
    message: string,
    type: string = "INTERNAL_ERROR",
    code?: string,
    details?: Record<string, unknown>,
    status: number = 500
  ): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        type,
        message,
        ...(code && { code }),
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a validation error response
   */
  static validationError(
    message: string,
    errors?: Record<string, string[]>
  ): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      message,
      "VALIDATION_ERROR",
      "VALIDATION_FAILED",
      errors ? { validationErrors: errors } : undefined,
      400
    );
  }

  /**
   * Create a not found error response
   */
  static notFound(
    resource: string,
    id?: string | number
  ): NextResponse<ApiErrorResponse> {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;

    return ResponseHelper.error(
      message,
      "NOT_FOUND_ERROR",
      "RESOURCE_NOT_FOUND",
      { resource, id },
      404
    );
  }

  /**
   * Create an unauthorized error response
   */
  static unauthorized(
    message: string = "Authentication required"
  ): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      message,
      "AUTHENTICATION_ERROR",
      "AUTHENTICATION_REQUIRED",
      undefined,
      401
    );
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(
    message: string = "Insufficient permissions"
  ): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      message,
      "AUTHORIZATION_ERROR",
      "INSUFFICIENT_PERMISSIONS",
      undefined,
      403
    );
  }

  /**
   * Create a rate limit error response
   */
  static rateLimited(
    message: string = "Rate limit exceeded"
  ): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      message,
      "RATE_LIMIT_ERROR",
      "RATE_LIMIT_EXCEEDED",
      undefined,
      429
    );
  }

  /**
   * Create a bad request error response
   */
  static badRequest(
    message: string,
    details?: Record<string, unknown>
  ): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      message,
      "VALIDATION_ERROR",
      "BAD_REQUEST",
      details,
      400
    );
  }

  /**
   * Create a service unavailable error response
   */
  static serviceUnavailable(
    service: string,
    message?: string
  ): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      message || `${service} service is currently unavailable`,
      "EXTERNAL_API_ERROR",
      "SERVICE_UNAVAILABLE",
      { service },
      503
    );
  }
}

/**
 * Common API response patterns for movie-related endpoints
 */
export class MovieApiResponses {
  static movieNotFound(movieId: number): NextResponse<ApiErrorResponse> {
    return ResponseHelper.notFound("Movie", movieId);
  }

  static moviesSuccess<T>(
    movies: T[],
    total?: number,
    page?: number,
    limit?: number
  ): NextResponse<ApiSuccessResponse<T[]>> {
    if (total !== undefined && page !== undefined && limit !== undefined) {
      return ResponseHelper.successWithPagination(
        movies,
        page,
        limit,
        total,
        `Retrieved ${movies.length} movies`
      );
    }

    return ResponseHelper.success(movies, `Retrieved ${movies.length} movies`);
  }

  static movieSuccess<T>(movie: T): NextResponse<ApiSuccessResponse<T>> {
    return ResponseHelper.success(movie, "Movie retrieved successfully");
  }

  static recommendationsSuccess<T>(
    recommendations: T[],
    totalConsidered: number
  ): NextResponse<
    ApiSuccessResponse<{ recommendations: T[]; totalConsidered: number }>
  > {
    return ResponseHelper.success(
      { recommendations, totalConsidered },
      `Generated ${recommendations.length} recommendations from ${totalConsidered} movies`
    );
  }

  static curationSuccess(
    moviesCount: number,
    operation: string = "curation"
  ): NextResponse<ApiSuccessResponse<{ count: number; operation: string }>> {
    return ResponseHelper.success(
      { count: moviesCount, operation },
      `${operation} completed successfully with ${moviesCount} movies`
    );
  }

  static syncSuccess(
    moviesProcessed: number,
    duration?: number
  ): NextResponse<
    ApiSuccessResponse<{ moviesProcessed: number; duration?: number }>
  > {
    const message = duration
      ? `Synchronized ${moviesProcessed} movies in ${duration}ms`
      : `Synchronized ${moviesProcessed} movies`;

    return ResponseHelper.success({ moviesProcessed, duration }, message);
  }

  static tmdbError(operation: string): NextResponse<ApiErrorResponse> {
    return ResponseHelper.serviceUnavailable(
      "TMDB",
      `Failed to ${operation} from TMDB API`
    );
  }

  static databaseError(operation: string): NextResponse<ApiErrorResponse> {
    return ResponseHelper.error(
      `Database ${operation} failed`,
      "DATABASE_ERROR",
      "DATABASE_OPERATION_FAILED",
      undefined,
      500
    );
  }
}

/**
 * Request validation helpers
 */
export class RequestValidator {
  static validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): string[] {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        missing.push(field);
      }
    }

    return missing;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateNumber(
    value: unknown,
    min?: number,
    max?: number
  ): { valid: boolean; error?: string } {
    if (typeof value !== "number" || isNaN(value)) {
      return { valid: false, error: "Must be a valid number" };
    }

    if (min !== undefined && value < min) {
      return { valid: false, error: `Must be at least ${min}` };
    }

    if (max !== undefined && value > max) {
      return { valid: false, error: `Must be at most ${max}` };
    }

    return { valid: true };
  }

  static validateArray(
    value: unknown,
    minLength?: number,
    maxLength?: number
  ): { valid: boolean; error?: string } {
    if (!Array.isArray(value)) {
      return { valid: false, error: "Must be an array" };
    }

    if (minLength !== undefined && value.length < minLength) {
      return { valid: false, error: `Must have at least ${minLength} items` };
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return { valid: false, error: `Must have at most ${maxLength} items` };
    }

    return { valid: true };
  }

  static validateString(
    value: unknown,
    minLength?: number,
    maxLength?: number
  ): { valid: boolean; error?: string } {
    if (typeof value !== "string") {
      return { valid: false, error: "Must be a string" };
    }

    if (minLength !== undefined && value.length < minLength) {
      return {
        valid: false,
        error: `Must be at least ${minLength} characters`,
      };
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return { valid: false, error: `Must be at most ${maxLength} characters` };
    }

    return { valid: true };
  }
}

/**
 * Helper to wrap API route handlers with consistent error handling and logging
 */
export function withApiHandler<T>(
  handler: (request: Request, context?: T) => Promise<NextResponse>,
) {
  return async (request: Request, context?: T): Promise<NextResponse> => {

    try {
      const response = await handler(request, context);

      return response;
    } catch (error) {
      throw error;
    }
  };
}

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
