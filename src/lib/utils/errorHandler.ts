/**
 * Centralized error handling utilities for the MovieRank application
 * Provides consistent error handling patterns and standardized error responses
 */

// Standard error types for the application
export enum ErrorType {
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
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
