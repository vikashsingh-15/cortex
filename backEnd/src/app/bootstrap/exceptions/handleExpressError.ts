import { NextFunction, Response, Request } from "express";

// Extended error type to include statusCode and optional code
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export function handleExpressError(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If response was already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine HTTP status code
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Determine error type
  let errorType = "ServerError";
  if (err.name === "ValidationError") errorType = "ValidationError";
  else if (err.message.includes("credits")) errorType = "InsufficientCredits";
  else if (err.name === "MongoError") errorType = "DatabaseError";

  // Build structured JSON response
  const errorResponse = {
    error: {
      message: err.message || "Internal Server Error",
      type: errorType,
      code: err.code || null,
      status: statusCode,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    },
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development" && err.stack) {
    (errorResponse.error as any).stack = err.stack;
  }

  // Send JSON response
  res.status(statusCode).json(errorResponse);
}
