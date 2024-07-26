import { useEffect } from "react";

export function useWebSocket(
  uri: string,
  onmessage: (this: WebSocket, ev: MessageEvent) => void,
) {
  useEffect(() => {
    console.log("uri", uri, onmessage);

    const socket = new WebSocket(uri);

    const onOpen = () => {
      console.log("Connected to websocket server", { uri });
    };

    // Check if the socket is already open
    if (socket.readyState === WebSocket.OPEN) {
      onOpen();
    } else {
      socket.addEventListener("open", onOpen);
    }

    socket.addEventListener("message", onmessage);
    socket.addEventListener("close", (ev) => {
      console.debug("Disconnected from websocket server", uri, ev);
    });

    socket.onerror = (error) => {
      console.error("Error with websocket server", uri, error);
      // console.error('WebSocket Error:', event.message);
      // console.error('Event Type:', event.type);
      // console.error('WebSocket State:', socket.readyState);
      // console.error('WebSocket URL:', socket.url);
      // console.error('WebSocket Protocol:', socket.protocol);
      // console.error('WebSocket Extensions:', socket.extensions);
      // console.error('WebSocket Close Code:', socket.closeCode);
      // console.error('WebSocket Close Reason:', socket.closeReason);
    };

    return () => {
      console.log("closing socket", uri, socket.readyState);
      // if (socket.readyState )
      socket.close();
    };
  }, [uri, onmessage]);
}
