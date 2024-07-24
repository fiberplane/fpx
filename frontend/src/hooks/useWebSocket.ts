import { useEffect } from "react";

export function useWebSocket(uri: string, onmessage: WebSocket["onmessage"]) {
  useEffect(() => {
    console.log('uri', uri, onmessage)
    const socket = new WebSocket(uri);

    socket.onopen = () => {
      console.debug("Connected to websocket server", {uri});
    };

    socket.onmessage = onmessage;

    socket.onclose = (ev) => {
      console.debug("Disconnected from websocket server", uri, ev);
    };

    socket.onerror = (error) => {
      console.error("Error with websocket server",uri, error);
      console.error('WebSocket Error:', event.message);
      console.error('Event Type:', event.type);
      console.error('WebSocket State:', socket.readyState);
      console.error('WebSocket URL:', socket.url);
      console.error('WebSocket Protocol:', socket.protocol);
      console.error('WebSocket Extensions:', socket.extensions);
      console.error('WebSocket Close Code:', socket.closeCode);
      console.error('WebSocket Close Reason:', socket.closeReason);
    };

    return () => {
      console.log('closing socket', uri, socket.readyState)
      socket.close();
    };
  }, [uri, onmessage]);
}
