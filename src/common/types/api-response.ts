export class ApiResponse<T = unknown> {
  constructor(
    public message: string,
    public data?: T,
    public meta?: Record<string, unknown>,
  ) {}
}
