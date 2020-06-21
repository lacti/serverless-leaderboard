import { APIGatewayProxyEvent } from "aws-lambda";
import ApiError from "./ApiError";
import ResourceId from "../models/ResourceId";

export default function resolveResourceIdFromEvent(
  event: APIGatewayProxyEvent
): ResourceId {
  const { serviceId, period } = event.pathParameters ?? {};
  if (!serviceId || !period) {
    throw new ApiError(400);
  }
  return { serviceId, period };
}
