import { useEffect, useRef, useState } from "react";

const buildApiUrl = (path) => {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (!base) return path;
  const cleaned = path.startsWith("/") ? path.slice(1) : path;
  try {
    return new URL(cleaned, base).toString();
  } catch {
    return `${base}${cleaned}`;
  }
};

export default function useSSE(path, { enabled = true, onMessage } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const retryRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !path) return;
    let isActive = true;
    const controller = new AbortController();

    const connect = async () => {
      try {
        setConnected(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
        const res = await fetch(buildApiUrl(path), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`SSE failed: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (isActive) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split("\n");
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const payload = line.replace(/^data:\s?/, "");
                if (!payload) continue;
                try {
                  const json = JSON.parse(payload);
                  setData(json);
                  onMessageRef.current?.(json);
                } catch (e) {
                  // ignore malformed payloads
                }
              }
            }
          }
        }
      } catch (e) {
        if (isActive) setError(e);
      } finally {
        if (isActive) {
          setConnected(false);
          retryRef.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isActive = false;
      controller.abort();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [path, enabled]);

  return { data, error, connected };
}
