import { RequestIdMiddleware, RequestWithId } from './request-id.middleware';
import { Response } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockRequest: Partial<RequestWithId>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should generate a new UUID if "x-request-id" header is missing', () => {
    middleware.use(
      mockRequest as RequestWithId,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockRequest.requestId).toBeDefined();
    expect(mockRequest.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-request-Id',
      mockRequest.requestId,
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should use the provided "x-request-id" header if it exists and is a valid string', () => {
    const customId = 'my-custom-request-id-123';
    mockRequest.headers = { 'x-request-id': customId };

    middleware.use(
      mockRequest as RequestWithId,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockRequest.requestId).toBe(customId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-request-Id',
      customId,
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should generate a new UUID if "x-request-id" header is an array (invalid format)', () => {
    mockRequest.headers = { 'x-request-id': ['id-1', 'id-2'] };

    middleware.use(
      mockRequest as RequestWithId,
      mockResponse as Response,
      nextFunction,
    );

    expect(typeof mockRequest.requestId).toBe('string');
    expect(mockRequest.requestId).not.toEqual(['id-1', 'id-2']);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-request-Id',
      mockRequest.requestId,
    );
    expect(nextFunction).toHaveBeenCalled();
  });
});
