"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  appName: string;
  message: string;
  status: "ok" | "degraded";
};

type ConnectionState =
  | { status: "checking" }
  | { status: "ok"; health: HealthResponse }
  | { status: "degraded"; health: HealthResponse };

const SAFE_FAILURE: HealthResponse = {
  appName: "StudyCraft",
  message: "StudyCraft cannot reach its study service right now.",
  status: "degraded",
};

export function ConnectionStatus() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking",
  });

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const health = (await response.json()) as HealthResponse;

        if (active) {
          setConnection({ health, status: response.ok ? "ok" : "degraded" });
        }
      } catch {
        if (active) {
          setConnection({ health: SAFE_FAILURE, status: "degraded" });
        }
      }
    }

    void checkConnection();

    return () => {
      active = false;
    };
  }, []);

  if (connection.status === "checking") {
    return (
      <section aria-live="polite" className="connection-card is-checking">
        <span className="status-dot" aria-hidden="true" />
        <p>Checking the study service…</p>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      className={`connection-card is-${connection.status}`}
    >
      <span className="status-dot" aria-hidden="true" />
      <div>
        <p className="connection-message">{connection.health.message}</p>
        {connection.status === "ok" ? (
          <p className="connection-detail">
            Live configuration: {connection.health.appName}
          </p>
        ) : (
          <p className="connection-detail">Please try again shortly.</p>
        )}
      </div>
    </section>
  );
}
