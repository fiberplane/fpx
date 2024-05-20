type Lifecycle = "request" | "response" | "db-error" | "mock";

export type RequestLog = {
  method: string,
  lifecycle: Lifecycle,
  path: string,
}

export type ResponseLog = {
  method: string,
  lifecycle: Lifecycle,
  path: string,
  route: string,
  handler: string,
  status: string,
  elapsed: number,
}

export type DbErrorLog = {
  // TODO - Fill with useful stuff
}

export type MockLog = {
  // TODO
  id: number;

}

/**
 * Mocked call to fetch logs
 */
export const fetchMockLogs = async (): Promise<{ json: () => Promise<{ logs: Array<MockLog> }> }> => {
  // TODO
  return new Promise(r => {
    r({
      json: async () => ({
        logs: []
      })
    })
  })
}