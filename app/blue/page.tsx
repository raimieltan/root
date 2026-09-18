"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import RootChrome from "@/app/ui/root-chrome";
import { useOperation } from "@/app/use-operation";

export default function BlueTeamPage() {
  const { ids, view, refresh, error, setError, retry } = useOperation("BLUE");

  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState(false);

  const busy = useRef(false);

  const [hostId, setHostId] = useState("");
  const [identity, setIdentity] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const [evidence, setEvidence] = useState<string[]>([]);
  const [finding, setFinding] = useState("");
  const [findingStatus, setFindingStatus] = useState("HYPOTHESIS");

  const selected =
    view?.machines.find((machine) => machine.id === hostId) ??
    view?.machines.find((machine) => machine.zone !== "EXTERNAL");

  async function advance() {
    if (!ids || busy.current) return;

    busy.current = true;
    setPending(true);

    try {
      const response = await fetch("/api/sim/blue/advance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ids),
      });

      if (!response.ok) {
        throw new Error("Unable to advance simulation");
      }

      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  useEffect(() => {
    if (!running || view?.scenario.state !== "ACTIVE") {
      return;
    }

    const timer = window.setInterval(() => {
      void advance();
    }, 12000);

    return () => {
      window.clearInterval(timer);
    };
  }, [running, view?.scenario.state, ids]);

  async function respond(
    action: string,
    extras: Record<string, unknown> = {},
  ) {
    if (!ids || busy.current) return;

    busy.current = true;
    setPending(true);

    try {
      const response = await fetch("/api/sim/blue/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...ids,
          action,
          targetId: selected?.id,
          ...extras,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Response failed");
      }

      setError("");

      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (!ids || !view) {
    return (
      <main className="loading-screen">
        <p role={error ? "alert" : undefined}>{error || "Connecting defensive telemetry…"}</p>
        {error && <button type="button" onClick={retry}>Retry connection</button>}
        <Link href="/">Return to operations</Link>
      </main>
    );
  }

  const active = view.scenario.state === "ACTIVE";

  const events = view.events.filter((event) => {
    const categoryMatch = !category || event.category === category;

    const queryMatch =
      !query ||
      `${event.source} ${event.target} ${event.userId} ${event.action}`
        .toLowerCase()
        .includes(query.toLowerCase());

    return categoryMatch && queryMatch;
  });

  const reviewed = new Set(
    view.events
      .filter((event) => event.action === "ALERT_REVIEWED")
      .flatMap(
        (event) =>
          (event.metadata.evidenceIds as string[] | undefined) ?? [],
      ),
  );

  const identities = [
    ...new Set(
      view.events
        .map((event) => event.userId)
        .filter((user): user is string => Boolean(user)),
    ),
  ];

  return (
    <RootChrome
      context="blue"
      active="soc"
      tone="blue"
      title={`${view.operation.organization} // SECURITY OPERATIONS`}
      operator="analyst@nodeline"
      privilege="ANALYST"
    >
      <div className="workspace-toolbar">
        <strong>{view.operation.name}</strong>

        <span>
          {view.scenario.state} // {view.availability.percent}% AVAILABILITY
        </span>

        <button
          type="button"
          disabled={!active || pending}
          onClick={() => setRunning((current) => !current)}
        >
          {running ? "Pause simulation" : "Run simulation"}
        </button>

        <button
          type="button"
          disabled={!active || pending}
          onClick={() => void advance()}
        >
          Advance one step
        </button>
      </div>

      {error && (
        <p className="workspace-error" role="alert">
          {error}
        </p>
      )}

      {pending && <p className="workspace-status" role="status">Synchronizing evidence and simulation state…</p>}

      <fieldset
        className="soc-fieldset"
        disabled={pending}
        aria-busy={pending}
      >
        <div className="soc-grid campaign-soc">
          {/* MISSION */}
          <section className="panel soc-mission">
            <header className="panel-title">
              MISSION // RESPONSE WINDOW
            </header>

            <div className="data-list">
              <p>{view.operation.briefing.blue}</p>

              {view.operation.briefing.constraints.map((constraint) => (
                <p key={constraint}>{constraint}</p>
              ))}

              {view.assistance === "GUIDED" && (
                <p>
                  Review alerts, filter authentication by identity and host,
                  and pin evidence into a finding. Stop every objective path
                  while keeping at least{" "}
                  {view.operation.conditions.minimumAvailability}%
                  availability. Pause to investigate; advance when ready.
                </p>
              )}
            </div>
          </section>

          {/* ALERTS */}
          <section className="panel soc-alerts">
            <header className="panel-title">ALERT QUEUE</header>

            <div className="data-list">
              {view.alerts.map((alert) => (
                <article key={alert.id}>
                  <b>
                    {alert.severity} // {alert.title}
                  </b>

                  <p>{alert.summary}</p>
                  <p>{alert.rationale}</p>

                  <button
                    type="button"
                    disabled={!active || reviewed.has(alert.id)}
                    onClick={() => {
                      setEvidence((items) => [
                        ...new Set([
                          ...items,
                          alert.evidenceEventId ?? alert.id,
                        ]),
                      ]);

                      void respond("ALERT_REVIEWED", {
                        evidenceIds: [alert.id],
                      });
                    }}
                  >
                    {reviewed.has(alert.id)
                      ? "Reviewed"
                      : "Investigate and pin"}
                  </button>
                </article>
              ))}

              {!view.alerts.length && (
                <p>No detection rules have fired.</p>
              )}
            </div>
          </section>

          {/* EVENT TIMELINE */}
          <section className="panel soc-events">
            <header className="panel-title">
              EVENT TIMELINE // SHARED TELEMETRY
            </header>

            <div className="campaign-filters">
              <label>
                Category

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">All</option>

                  {[
                    "AUTH",
                    "NETWORK",
                    "WEB",
                    "PROCESS",
                    "FILESYSTEM",
                    "PRIVILEGE",
                    "PERSISTENCE",
                    "SYSTEM",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Host or identity

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="campaign-table">
              <table>
                <thead>
                  <tr>
                    <th>Evidence</th>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Source → target</th>
                    <th>Identity</th>
                    <th>Context</th>
                  </tr>
                </thead>

                <tbody>
                  {events
                    .slice()
                    .reverse()
                    .map((event) => (
                      <tr key={event.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Pin ${event.action} ${event.id}`}
                            checked={evidence.includes(event.id)}
                            onChange={() =>
                              setEvidence((items) =>
                                items.includes(event.id)
                                  ? items.filter(
                                      (item) => item !== event.id,
                                    )
                                  : [...items, event.id],
                              )
                            }
                          />
                        </td>

                        <td>{event.timestamp.slice(11, 19)}</td>

                        <td>{event.action}</td>

                        <td>
                          {event.source ?? "—"} →{" "}
                          {event.target ?? "—"}
                        </td>

                        <td>{event.userId ?? "—"}</td>

                        <td>
                          {String(event.metadata.context ?? "")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* HOST INSPECTION */}
          <section className="panel soc-host">
            <header className="panel-title">
              HOST / PROCESS INSPECTION
            </header>

            <div className="data-list">
              <label>
                Host

                <select
                  value={selected?.id ?? ""}
                  onChange={(event) =>
                    setHostId(event.target.value)
                  }
                >
                  {view.machines
                    .filter(
                      (machine) => machine.zone !== "EXTERNAL",
                    )
                    .map((machine) => (
                      <option
                        key={machine.id}
                        value={machine.id}
                      >
                        {machine.hostname} // {machine.state}
                      </option>
                    ))}
                </select>
              </label>

              <div className="response-grid">
                {[
                  ["INSPECT_HOST", "Inspect host"],
                  ["INSPECT_PROCESS", "Inspect processes"],
                  ["ISOLATE_HOST", "Isolate host"],
                  ["REMOVE_PERSISTENCE", "Remove persistence"],
                  ["RESTORE_HOST", "Restore service"],
                ].map(([action, label]) => (
                  <button
                    type="button"
                    disabled={!active}
                    key={action}
                    onClick={() => void respond(action)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selected?.processes.map((process) => (
                <code key={process.id}>
                  {process.pid} {process.runningAs} {process.name}
                </code>
              ))}

              {selected?.persistence.map((persistence) => (
                <p key={persistence.id}>
                  Startup artifact: {persistence.type}
                </p>
              ))}

              {view.availability.services
                .filter((service) =>
                  service.hosts.includes(
                    selected?.hostname ?? "",
                  ),
                )
                .map((service) => (
                  <p key={service.name}>
                    {service.name}: {service.state}. Containment
                    consequence: {service.impact}
                  </p>
                ))}
            </div>
          </section>

          {/* AUTHENTICATION */}
          <section className="panel soc-auth">
            <header className="panel-title">
              AUTHENTICATION / SESSIONS
            </header>

            <div className="data-list">
              <label>
                Identity

                <select
                  value={identity}
                  onChange={(event) =>
                    setIdentity(event.target.value)
                  }
                >
                  <option value="">
                    Select observed identity
                  </option>

                  {identities.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={!active || !identity}
                onClick={() => {
                  setCategory("AUTH");
                  setQuery(identity);

                  void respond("INSPECT_USER", {
                    username: identity,
                  });
                }}
              >
                Inspect identity
              </button>

              <button
                type="button"
                disabled={!active || !identity}
                onClick={() =>
                  void respond("RESET_PASSWORD", {
                    username: identity,
                  })
                }
              >
                Reset credential
              </button>

              {view.sessions
                .filter(
                  (session) =>
                    session.machine === selected?.hostname,
                )
                .map((session) => (
                  <p key={session.id}>
                    {session.user}@{session.machine}{" "}

                    <button
                      type="button"
                      disabled={!active}
                      onClick={() =>
                        void respond("REVOKE_SESSION", {
                          sessionId: session.id,
                        })
                      }
                    >
                      Revoke session
                    </button>
                  </p>
                ))}
            </div>
          </section>

          {/* NETWORK */}
          <section className="panel soc-network">
            <header className="panel-title">
              NETWORK RESPONSE
            </header>

            <div className="data-list">
              {view.connections
                .filter(
                  (connection) =>
                    connection.target ===
                      selected?.hostname ||
                    connection.source ===
                      selected?.hostname,
                )
                .map((connection) => (
                  <p key={connection.id}>
                    {connection.source} → {connection.target}:
                    {connection.port} //{" "}
                    {connection.allowed
                      ? "ALLOWED"
                      : "BLOCKED"}{" "}

                    <button
                      type="button"
                      disabled={!active || !connection.allowed}
                      onClick={() =>
                        void respond("BLOCK_CONNECTION", {
                          connectionId: connection.id,
                        })
                      }
                    >
                      Block connection
                    </button>
                  </p>
                ))}
            </div>
          </section>

          {/* INCIDENT */}
          <section className="panel soc-incident">
            <header className="panel-title">
              INCIDENT WORKSPACE
            </header>

            <div className="data-list">
              <p>{evidence.length} evidence items pinned</p>

              <label>
                Finding

                <textarea
                  value={finding}
                  onChange={(event) =>
                    setFinding(event.target.value)
                  }
                  maxLength={2000}
                />
              </label>

              <label>
                Status

                <select
                  value={findingStatus}
                  onChange={(event) =>
                    setFindingStatus(event.target.value)
                  }
                >
                  <option value="HYPOTHESIS">
                    HYPOTHESIS
                  </option>
                  <option value="CONFIRMED">
                    CONFIRMED
                  </option>
                  <option value="DISMISSED">
                    DISMISSED
                  </option>
                </select>
              </label>

              <button
                type="button"
                disabled={
                  !active ||
                  !evidence.length ||
                  !finding.trim()
                }
                onClick={() =>
                  void respond("INCIDENT_FINDING", {
                    evidenceIds: evidence,
                    finding,
                    status: findingStatus,
                  })
                }
              >
                Record finding
              </button>

              {view.events
                .filter(
                  (event) =>
                    event.action === "INCIDENT_FINDING",
                )
                .map((event) => {
                  const findingEvidence =
                    (event.metadata
                      .evidenceIds as string[] | undefined) ??
                    [];

                  return (
                    <article key={event.id}>
                      <b>
                        {String(event.metadata.status)}
                      </b>

                      <p>
                        {String(event.metadata.finding)}
                      </p>

                      <small>
                        {findingEvidence.length} linked
                        observations
                      </small>
                    </article>
                  );
                })}
            </div>
          </section>

          {/* AVAILABILITY */}
          <section className="panel soc-availability">
            <header className="panel-title">
              SERVICE AVAILABILITY
            </header>

            <div className="data-list">
              {view.availability.services.map((service) => (
                <p key={service.name}>
                  {service.name}:{" "}
                  <b>{service.state}</b>{" "}
                  {service.state !== "HEALTHY" &&
                    service.impact}
                </p>
              ))}
            </div>
          </section>
        </div>
      </fieldset>

      {!active && (
        <div className="operation-result">
          <strong>
            {view.scenario.state === "COMPLETED"
              ? "OBJECTIVE PROTECTED"
              : view.objectiveRetrieved
                ? "OBJECTIVE LOST"
                : "AVAILABILITY REQUIREMENT MISSED"}
          </strong>

          <Link
            className="primary-button"
            href={`/replay/${ids.scenarioId}?actor=${ids.actorId}`}
          >
            Open reconstruction
          </Link>
        </div>
      )}
    </RootChrome>
  );
}
