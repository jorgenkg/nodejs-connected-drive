import fetch from "cross-fetch";

export interface RetryConfig {
    limit?: number
    statusCodes?: number[]
}

export default async function fetchRetry(
  input: RequestInfo,
  init?: RequestInit,
  retryConfig: RetryConfig = {}
): Promise<Response> {
  let retriesLeft = (retryConfig.limit ?? 1) - 1;
  const statusCodes = retryConfig.statusCodes ?? [];
  let response = await fetch(input, init);
  while (retriesLeft > 0 && !statusCodes.includes(response?.status ?? -1)) {
    response = await fetch(input, init);
    retriesLeft--;
  }
  return response;
}
