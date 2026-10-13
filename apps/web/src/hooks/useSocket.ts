"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@raja-rani/shared";

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function useSocket() {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(socketInstance);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    let isMounted = true;

    if (!socketInstance) {
      import("socket.io-client").then(({ io }) => {
        if (!isMounted) return;

        const host = window.location.hostname || "localhost";
        const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://${host}:4000`;
        const instance = io(serverUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
        });

        instance.on("connect", () => {
          if (isMounted) setConnected(true);
        });

        instance.on("disconnect", () => {
          if (isMounted) setConnected(false);
        });

        socketInstance = instance;
        if (isMounted) {
          setSocket(instance);
          setConnected(instance.connected);
        }
      });
    } else {
      setSocket(socketInstance);
      setConnected(socketInstance.connected);
    }

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  return { socket, connected };
}
