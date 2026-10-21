import { io } from "socket.io-client";
import { getConnection, initConnection, onConnectionChange } from "./config";

export const CATALOG_UPDATED_EVENT = "catalog.updated";

export const subscribeToCatalogUpdates = (
  onUpdate: () => void,
): (() => void) => {
  let stopped = false;
  let closeSocket = () => {};
  let unsubscribeConnection: (() => void) | undefined;

  const connect = () => {
    closeSocket();
    const apiUrl = getConnection().apiUrl;
    if (!apiUrl) {
      closeSocket = () => {};
      return;
    }

    const socket = io(`${apiUrl}/catalog`, {
      transports: ["websocket"],
      reconnection: true,
    });
    socket.on("connect", onUpdate);
    socket.on(CATALOG_UPDATED_EVENT, onUpdate);
    socket.on("connect_error", (error) => {
      console.warn("Catalog realtime connection failed:", error.message);
    });
    closeSocket = () => socket.disconnect();
  };

  void initConnection().then(() => {
    if (stopped) return;
    unsubscribeConnection = onConnectionChange(connect);
    connect();
  });

  return () => {
    stopped = true;
    unsubscribeConnection?.();
    closeSocket();
  };
};
