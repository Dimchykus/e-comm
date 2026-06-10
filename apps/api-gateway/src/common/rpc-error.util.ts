import { HttpException, HttpStatus } from '@nestjs/common';

interface RpcErrorShape {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Microservices reply to failed requests with the plain object passed to
 * RpcException. Convert it back into an HttpException so the gateway
 * returns the original status code instead of a generic 500.
 */
export function toHttpException(err: unknown): HttpException {
  const rpcError = (err ?? {}) as RpcErrorShape;
  const status =
    typeof rpcError.statusCode === 'number'
      ? rpcError.statusCode
      : HttpStatus.INTERNAL_SERVER_ERROR;

  return new HttpException(
    {
      statusCode: status,
      message: rpcError.message ?? 'Internal server error',
      error: rpcError.error,
    },
    status,
  );
}
