import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";

describe("api-error", () => {
  it("defines expected stable error codes", () => {
    assert.deepEqual(API_ERROR_CODE, {
      invalidParam: "INVALID_PARAM",
      invalidPayload: "INVALID_PAYLOAD",
      unauthenticated: "UNAUTHENTICATED",
      forbidden: "FORBIDDEN",
      notFound: "NOT_FOUND",
      conflict: "CONFLICT",
      unprocessableEntity: "UNPROCESSABLE_ENTITY",
      internalError: "INTERNAL_ERROR"
    });
  });

  it("sendApiError writes status and payload (with extra fields)", () => {
    let capturedStatus: number | null = null;
    let capturedBody: unknown = null;

    const res = {
      status: (code: number) => {
        capturedStatus = code;
        return {
          json: (payload: unknown) => {
            capturedBody = payload;
            return payload;
          }
        };
      }
    };

    sendApiError(
      res as unknown as Parameters<typeof sendApiError>[0],
      403,
      API_ERROR_CODE.forbidden,
      "No autorizado.",
      { requiredPermission: "workflow.read" }
    );

    assert.equal(capturedStatus, 403);
    assert.deepEqual(capturedBody, {
      code: "FORBIDDEN",
      message: "No autorizado.",
      requiredPermission: "workflow.read"
    });
  });
});
