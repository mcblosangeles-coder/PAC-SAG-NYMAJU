import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapExpedienteServiceStatusToErrorCode } from "../modules/expedientes/error-mapping";

describe("expedientes error mapping", () => {
  it("maps 404 to NOT_FOUND", () => {
    assert.equal(mapExpedienteServiceStatusToErrorCode(404), "NOT_FOUND");
  });

  it("maps 409 to CONFLICT", () => {
    assert.equal(mapExpedienteServiceStatusToErrorCode(409), "CONFLICT");
  });

  it("maps 422 to UNPROCESSABLE_ENTITY", () => {
    assert.equal(mapExpedienteServiceStatusToErrorCode(422), "UNPROCESSABLE_ENTITY");
  });

  it("maps 400 to INVALID_PARAM", () => {
    assert.equal(mapExpedienteServiceStatusToErrorCode(400), "INVALID_PARAM");
  });

  it("maps unknown status to INTERNAL_ERROR", () => {
    assert.equal(mapExpedienteServiceStatusToErrorCode(500), "INTERNAL_ERROR");
    assert.equal(mapExpedienteServiceStatusToErrorCode(503), "INTERNAL_ERROR");
  });
});
