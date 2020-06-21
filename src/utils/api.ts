import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

import ApiError from "./ApiError";

export default function api(
  delegate: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): APIGatewayProxyHandler {
  return async (event) => {
    try {
      return await delegate(event);
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        return error;
      }
      return { statusCode: 400, body: "" };
    }
  };
}
