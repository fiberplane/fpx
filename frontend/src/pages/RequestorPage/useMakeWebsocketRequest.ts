import { useCallback, useReducer, useRef } from "react";

// Define action types
const WEBSOCKET_CONNECTING = "WEBSOCKET_CONNECTING";
const WEBSOCKET_CONNECTED = "WEBSOCKET_CONNECTED";
const WEBSOCKET_MESSAGE_RECEIVED = "WEBSOCKET_MESSAGE_RECEIVED";
const WEBSOCKET_MESSAGE_SENT = "WEBSOCKET_MESSAGE_SENT";
const WEBSOCKET_DISCONNECTED = "WEBSOCKET_DISCONNECTED";
const WEBSOCKET_ERROR = "WEBSOCKET_ERROR";

type WebSocketMessage = {
  data: string;
  timestamp: string;
  type: "received" | "sent";
};

// Define the state type
export type WebSocketState = {
  isConnecting: boolean;
  isConnected: boolean;
  hasError: boolean;
  messages: WebSocketMessage[];
};

type WebSocketAction = {
  type: string;
  payload?: WebSocketMessage;
};

const initialState: WebSocketState = {
  isConnecting: false,
  isConnected: false,
  hasError: false,
  messages: [],
};

// Define the reducer
function websocketReducer(
  state: WebSocketState,
  action: WebSocketAction,
): WebSocketState {
  switch (action.type) {
    case WEBSOCKET_CONNECTING:
      return { ...state, isConnecting: true, hasError: false };
    case WEBSOCKET_CONNECTED:
      return { ...state, isConnecting: false, isConnected: true };
    case WEBSOCKET_MESSAGE_RECEIVED:
      if (action.payload) {
        return { ...state, messages: [action.payload, ...state.messages] };
      }
      return state;
    case WEBSOCKET_DISCONNECTED:
      return { ...state, isConnected: false, isConnecting: false };
    case WEBSOCKET_ERROR:
      return { ...state, hasError: true, isConnecting: false };
    case WEBSOCKET_MESSAGE_SENT:
      if (action.payload) {
        return { ...state, messages: [action.payload, ...state.messages] };
      }
      return state;
    default:
      return state;
  }
}

export function useMakeWebsocketRequest() {
  const [state, dispatch] = useReducer(websocketReducer, initialState);
  const socket = useRef<WebSocket | null>(null);

  const connect = useCallback(
    (wsUrl: string) => {
      socket.current = new WebSocket(wsUrl);

      socket.current.onopen = () => {
        console.debug("Connected to websocket server");
        dispatch({ type: WEBSOCKET_CONNECTED });
      };

      socket.current.onmessage = (ev) => {
        console.debug("Received websocket message", ev?.data);
        const message = {
          data: ev?.data,
          timestamp: new Date().toISOString(),
          type: "received" as const,
        };
        dispatch({ type: WEBSOCKET_MESSAGE_RECEIVED, payload: message });
      };

      socket.current.onclose = (ev) => {
        console.debug("Disconnected from websocket server", ev);
        dispatch({ type: WEBSOCKET_DISCONNECTED });
      };

      socket.current.onerror = (error) => {
        console.error("Error with websocket server", error);
        dispatch({ type: WEBSOCKET_ERROR });
      };

      dispatch({ type: WEBSOCKET_CONNECTING });

      return {
        socket,
        state,
      };
    },
    [state],
  );

  // NOTE - Unsure if we should manually dispatch the disconnect event here or if the WebSocket API will handle it
  //        I had a case in the UI where the reducer state wasn't in sync with the actual state of the socket for some reason...
  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.close();
    }
  }, [socket]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket.current) {
        socket.current.send(message);
        const sentMessage = {
          data: message,
          timestamp: new Date().toISOString(),
          type: "sent" as const,
        };
        dispatch({ type: WEBSOCKET_MESSAGE_SENT, payload: sentMessage });
      } else {
        console.error(
          "Tried to send message but WebSocket connection not established",
        );
      }
    },
    [socket],
  );

  return {
    connect,
    disconnect,
    sendMessage,
    state,
  };
}
