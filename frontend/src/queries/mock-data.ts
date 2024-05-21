import { useEffect, useState } from "react";

type Lifecycle = "request" | "response" | "db-error" | "mock";
type LogLevel = "info" | "warning" | "error";

export type RequestLog = {
  id: number;
  level: LogLevel;
  message: {
    method: string;
    lifecycle: Lifecycle;
    path: string;
  };
  createdAt: string;
}

export type ResponseLog = {
  id: number;
  level: LogLevel;
  message: {
    method: string;
    lifecycle: Lifecycle;
    path: string;
    route: string;
    handler: string;
    status: string;
    elapsed: number;
  };
  createdAt: string;
}

export type DbErrorLog = {
  id: number;
  level: LogLevel;
  // TODO - Fill with useful stuff
  message: string;
  createdAt: string;
}

export type MockLog = RequestLog | ResponseLog;

const REQUEST_LOG: RequestLog = {
  id: 98998798,
  level: "info",
  message: {
    method: "GET",
    lifecycle: "request",
    path: "/",
  },
  createdAt: "2023-05-12T16:13:00.000Z",
};

const RESPONSE_LOG_SUCCESS: ResponseLog = {
  id: 23423,
  level: "info",
  message: {
    method: "GET",
    lifecycle: "response",
    path: "/widgets/12345",
    route: "/widgets/:id",
    handler: "index",
    status: "200",
    elapsed: 97,
  },
  createdAt: "2023-05-12T16:17:00.000Z",
};

const RESPONSE_LOG_ERROR_404: ResponseLog = {
  id: 4728653,
  level: "error",
  message: {
    method: "GET",
    lifecycle: "response",
    path: "/widgets/12345",
    route: "/widgets/:id",
    handler: "index",
    status: "404",
    elapsed: 57,
  },
  createdAt: "2023-05-12T16:14:00.000Z",
};

/**
 * Mocked call to fetch logs
 */
export const getMockLogs = async (): Promise<{ logs: Array<MockLog> }> => {
  return new Promise<{ logs: Array<MockLog> }>(r => {
    const logs = [REQUEST_LOG, RESPONSE_LOG_SUCCESS, RESPONSE_LOG_ERROR_404];
    logs.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    r({ logs });
  })
}

export function useMockLogs() {
  const [logs, setLogs] = useState([] as Array<MockLog>)

  useEffect(() => {
    getMockLogs().then(r => {
      setLogs(r.logs)
    })
  });

  return logs;
}
