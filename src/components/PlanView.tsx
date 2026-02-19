"use client";

import type { CSSProperties } from "react";
import type { PhysicalSpreadPlan } from "@/lib/physicalSpreadTypes";

export function PlanView({ plan }: { plan: PhysicalSpreadPlan }) {
  const pages =
    plan.spreadMode === "two_page"
      ? (["left", "right"] as const)
      : (["single"] as const);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>{plan.conceptTitle}</div>
        <div style={{ opacity: 0.8, fontSize: 13 }}>
          Mode:{" "}
          <b>{plan.spreadMode === "two_page" ? "Two-page spread" : "Single page"}</b>{" "}
          • Format: <b>{plan.pageFormat}</b>
        </div>
      </div>

      <section style={card()}>
        <h3 style={h3()}>Materials</h3>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {plan.materials.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section style={card()}>
        <h3 style={h3()}>Tape plan</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={subcard()}>
            <div style={{ fontWeight: 800 }}>Transparent tape</div>
            <ul style={{ paddingLeft: 18, margin: "8px 0 0 0" }}>
              {plan.tapePlan.transparentTape.map((t, i) => (
                <li key={i}>
                  <b>{t.technique}:</b> {t.useFor} — {t.notes}
                </li>
              ))}
            </ul>
          </div>

          <div style={subcard()}>
            <div style={{ fontWeight: 800 }}>Washi tape</div>
            <ul style={{ paddingLeft: 18, margin: "8px 0 0 0" }}>
              {plan.tapePlan.washiTape.map((t, i) => (
                <li key={i}>
                  <b>{t.technique}:</b> {t.useFor} — {t.notes}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={card()}>
        <h3 style={h3()}>Layout zones</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: pages.length === 2 ? "1fr 1fr" : "1fr",
            gap: 12
          }}
        >
          {pages.map((p) => (
            <div key={p} style={subcard()}>
              <div style={{ fontWeight: 800 }}>
                {p === "single" ? "Page" : `${p} page`}
              </div>
              <ul style={{ paddingLeft: 18, margin: "8px 0 0 0" }}>
                {plan.layout.zones
                  .filter((z) => z.page === p)
                  .map((z, i) => (
                    <li key={i}>
                      <b>{z.zoneId}</b> ({z.placement}): {z.description}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section style={card()}>
        <h3 style={h3()}>Layer recipe</h3>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          {plan.layerRecipe.map((s) => (
            <li key={s.step} style={{ marginBottom: 10 }}>
              <div>
                <b>{s.action}</b> — {s.target}{" "}
                <span style={{ opacity: 0.7 }}>({s.page})</span>
              </div>
              <div style={{ opacity: 0.9 }}>
                <b>How:</b> {s.method}
              </div>
              <div style={{ opacity: 0.75 }}>
                <b>Why:</b> {s.rationale}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section style={card()}>
        <h3 style={h3()}>Writing</h3>
        <div style={{ opacity: 0.85 }}>
          <b>Tone:</b> {plan.writing.toneGuidance}
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Prompts</b>
          <ul style={{ paddingLeft: 18, margin: "8px 0 0 0" }}>
            {plan.writing.prompts.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Draft paragraph</b>
          <div
            style={{
              marginTop: 6,
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12
            }}
          >
            {plan.writing.draftParagraph}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Micro captions</b>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {plan.writing.microCaptions.map((c, i) => (
              <span
                key={i}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 999,
                  padding: "6px 10px",
                  background: "white"
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={card()}>
        <h3 style={h3()}>Care tips</h3>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {plan.safetyAndCare.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function card(): CSSProperties {
  return { border: "1px solid #e8e8e8", borderRadius: 18, padding: 14, background: "white" };
}
function subcard(): CSSProperties {
  return { border: "1px solid #eee", borderRadius: 14, padding: 12, background: "white" };
}
function h3(): CSSProperties {
  return { margin: 0, marginBottom: 10, fontSize: 14 };
}
