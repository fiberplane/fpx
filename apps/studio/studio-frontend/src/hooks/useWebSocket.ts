import { useEffect } from "react";

export function useWebSocket(
  uri: string,
  onmessage: (this: WebSocket, ev: MessageEvent) => void,
) {
  useEffect(() => {
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
    };

    return () => {
      console.log("closing socket", uri, socket.readyState);
      socket.close();
    };
  }, [uri, onmessage]);
}
