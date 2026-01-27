"use strict";
// Shared type definitions for GitEval (used by both frontend and backend)
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationError = exports.ErrorCode = void 0;
// Error types
var ErrorCode;
(function (ErrorCode) {
    // User errors
    ErrorCode["INVALID_URL"] = "invalid_url";
    ErrorCode["REPOSITORY_NOT_FOUND"] = "repository_not_found";
    ErrorCode["REPOSITORY_TOO_LARGE"] = "repository_too_large";
    ErrorCode["PRIVATE_REPOSITORY"] = "private_repository";
    // System errors
    ErrorCode["GITHUB_API_ERROR"] = "github_api_error";
    ErrorCode["CLAUDE_API_ERROR"] = "claude_api_error";
    ErrorCode["DATABASE_ERROR"] = "database_error";
    ErrorCode["CACHE_ERROR"] = "cache_error";
    // Processing errors
    ErrorCode["CLONE_FAILED"] = "clone_failed";
    ErrorCode["ANALYSIS_TIMEOUT"] = "analysis_timeout";
    ErrorCode["PARSING_ERROR"] = "parsing_error";
    // Internal errors
    ErrorCode["UNKNOWN_ERROR"] = "unknown_error";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class EvaluationError extends Error {
    constructor(message, code, recoverable = false) {
        super(message);
        this.code = code;
        this.recoverable = recoverable;
        this.name = 'EvaluationError';
    }
}
exports.EvaluationError = EvaluationError;
//# sourceMappingURL=types.js.map