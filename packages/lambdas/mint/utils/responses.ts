export const createResponse = (
  statusCode: number,
  body: any,
  headers?: Record<string, string>
) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    ...headers,
  },
  body: JSON.stringify(body),
});
