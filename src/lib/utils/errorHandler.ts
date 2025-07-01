/**
 * Centralized error handling utilities for the MovieRank application
 * Provides consistent error handling patterns and standardized error responses
 */

import { NextResponse } from "next/server";

// Standard error types for the application
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode: number;
  details?: Record<string, unknown>;
  originalError?: Error;
}

export class MovieRankError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly originalError?: Error;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = "MovieRankError";
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.originalError = originalError;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MovieRankError);
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      originalError: this.originalError,
    };
  }
}

// Factory functions for common error types
export class ErrorFactory {
  static validationError(
    message: string,
    details?: Record<string, unknown>
  ): MovieRankError {
    return new MovieRankError(
      ErrorType.VALIDATION_ERROR,
      message,
      400,
      "VALIDATION_FAILED",
      details
    );
  }

  static databaseError(message: string, originalError?: Error): MovieRankError {
    return new MovieRankError(
      ErrorType.DATABASE_ERROR,
      message,
      500,
      "DATABASE_OPERATION_FAILED",
      undefined,
      originalError
    );
  }

  static externalApiError(
    service: string,
    message: string,
    originalError?: Error
  ): MovieRankError {
    return new MovieRankError(
      ErrorType.EXTERNAL_API_ERROR,
      `${service} API error: ${message}`,
      502,
      "EXTERNAL_API_FAILED",
      { service },
      originalError
    );
  }

  static authenticationError(
    message: string = "Authentication required"
  ): MovieRankError {
    return new MovieRankError(
      ErrorType.AUTHENTICATION_ERROR,
      message,
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  static authorizationError(
    message: string = "Insufficient permissions"
  ): MovieRankError {
    return new MovieRankError(
      ErrorType.AUTHORIZATION_ERROR,
      message,
      403,
      "INSUFFICIENT_PERMISSIONS"
    );
  }

  static notFoundError(resource: string, id?: string | number): MovieRankError {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    return new MovieRankError(
      ErrorType.NOT_FOUND_ERROR,
      message,
      404,
      "RESOURCE_NOT_FOUND",
      { resource, id }
    );
  }

  static rateLimitError(
    message: string = "Rate limit exceeded"
  ): MovieRankError {
    return new MovieRankError(
      ErrorType.RATE_LIMIT_ERROR,
      message,
      429,
      "RATE_LIMIT_EXCEEDED"
    );
  }

  static internalError(message: string, originalError?: Error): MovieRankError {
    return new MovieRankError(
      ErrorType.INTERNAL_ERROR,
      message,
      500,
      "INTERNAL_SERVER_ERROR",
      undefined,
      originalError
    );
  }
}

// Error handling utility for API routes
export class ApiErrorHandler {
  static handle(error: unknown): NextResponse {
    if (error instanceof MovieRankError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: error.type,
            message: error.message,
            code: error.code,
            ...(process.env.NODE_ENV === "development" &&
              error.details && { details: error.details }),
          },
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      // Don't expose internal error details in production
      const message =
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred";

      return NextResponse.json(
        {
          success: false,
          error: {
            type: ErrorType.INTERNAL_ERROR,
            message,
            code: "INTERNAL_SERVER_ERROR",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          type: ErrorType.INTERNAL_ERROR,
          message: "An unexpected error occurred",
          code: "UNKNOWN_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

// Service error handling utilities
export class ServiceErrorHandler {
  static async withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static wrapError(
    error: unknown,
    serviceName: string,
    operation: string
  ): MovieRankError {
    if (error instanceof MovieRankError) {
      return error;
    }

    if (error instanceof Error) {
      return ErrorFactory.internalError(
        `${serviceName} ${operation} failed: ${error.message}`,
        error
      );
    }

    return ErrorFactory.internalError(
      `${serviceName} ${operation} failed with unknown error`,
      new Error(String(error))
    );
  }
}

// Database error handling utilities
export class DatabaseErrorHandler {
  static wrapError(
    error: unknown,
    operation: string,
    table?: string
  ): MovieRankError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const context = table ? `${operation} on ${table}` : operation;

    // Check for common database error patterns
    if (
      errorMessage.includes("duplicate key") ||
      errorMessage.includes("unique constraint")
    ) {
      return ErrorFactory.validationError(
        `Record already exists: ${errorMessage}`,
        { operation, table, originalError: errorMessage }
      );
    }

    if (
      errorMessage.includes("foreign key constraint") ||
      errorMessage.includes("violates foreign key")
    ) {
      return ErrorFactory.validationError(
        `Invalid reference: ${errorMessage}`,
        { operation, table, originalError: errorMessage }
      );
    }

    if (
      errorMessage.includes("not null constraint") ||
      errorMessage.includes("null value")
    ) {
      return ErrorFactory.validationError(
        `Required field missing: ${errorMessage}`,
        { operation, table, originalError: errorMessage }
      );
    }

    if (
      errorMessage.includes("permission denied") ||
      errorMessage.includes("insufficient privilege")
    ) {
      return ErrorFactory.authorizationError(
        `Database permission denied for ${context}`
      );
    }

    // Generic database error
    return ErrorFactory.databaseError(
      `Database ${context} failed: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage)
    );
  }
}

// External API error handling utilities
export class ExternalApiErrorHandler {
  static wrapError(
    error: unknown,
    service: string,
    operation: string
  ): MovieRankError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for common API error patterns
    if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
      return ErrorFactory.authenticationError(
        `${service} authentication failed`
      );
    }

    if (errorMessage.includes("403") || errorMessage.includes("forbidden")) {
      return ErrorFactory.authorizationError(`${service} access denied`);
    }

    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      return ErrorFactory.notFoundError(`${service} resource`, operation);
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return ErrorFactory.rateLimitError(`${service} rate limit exceeded`);
    }

    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("ECONNRESET")
    ) {
      return ErrorFactory.externalApiError(
        service,
        `Connection timeout during ${operation}`,
        error instanceof Error ? error : new Error(errorMessage)
      );
    }

    // Generic external API error
    return ErrorFactory.externalApiError(
      service,
      `${operation} failed: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage)
    );
  }
}

// TMDB API specific helper function
export function createTmdbError(
  message: string,
  statusCode: number = 500,
  context?: Record<string, unknown>
): MovieRankError {
  return new MovieRankError(
    ErrorType.EXTERNAL_API_ERROR,
    message,
    statusCode,
    "TMDB_API_ERROR",
    context
  );
}

// Async operation wrapper with automatic error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext: {
    service: string;
    operation: string;
    type?: "database" | "external_api" | "service";
  }
): Promise<T> {
  try {
    return await ServiceErrorHandler.withErrorHandling(operation);
  } catch (error) {
    switch (errorContext.type) {
      case "database":
        throw DatabaseErrorHandler.wrapError(error, errorContext.operation);
      case "external_api":
        throw ExternalApiErrorHandler.wrapError(
          error,
          errorContext.service,
          errorContext.operation
        );
      default:
        throw ServiceErrorHandler.wrapError(
          error,
          errorContext.service,
          errorContext.operation
        );
    }
  }
}
