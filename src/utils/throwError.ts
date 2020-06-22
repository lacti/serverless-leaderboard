import ApiError from "./ApiError";

export default function throwError(statusCode = 400, body = "") {
  return (): never => {
    throw new ApiError(statusCode, body);
  };
}
