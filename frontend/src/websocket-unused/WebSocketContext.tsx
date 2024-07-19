/**
 * UNUSED
 *
 * The makings of a module to share a websocket connection across the app.
 */

import React, { createContext, ReactNode, useRef } from "react";

type WebSocketContextType = {
  socket?: WebSocket;
};

export const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export const WebSocketProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const webSocketRef = useRef<WebSocket>();

  // TODO - Set the websocket connection here, handle retries, etc...
  // NOTE - I started writing this on an airplane, so I'm certain there's a library that does this.
  //        (Which is why I stopped writing this and moved on to another thing)

  return (
    <WebSocketContext.Provider value={{ socket: webSocketRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};
