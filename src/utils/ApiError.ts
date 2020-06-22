export default class ApiError {
  constructor(
    public readonly statusCode: number = 400,
    public readonly body: string = ""
  ) {}
}
