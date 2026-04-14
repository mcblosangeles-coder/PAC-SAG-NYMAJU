import { API_ERROR_CODE, type ApiErrorCode } from "../../lib/api-error";

export const mapExpedienteServiceStatusToErrorCode = (statusCode: number): ApiErrorCode => {
  if (statusCode === 404) return API_ERROR_CODE.notFound;
  if (statusCode === 409) return API_ERROR_CODE.conflict;
  if (statusCode === 422) return API_ERROR_CODE.unprocessableEntity;
  return API_ERROR_CODE.internalError;
};
