import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "VAISH / Realm of the Untold"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(ellipse 100% 80% at 30% 20%, #2a1a0a 0%, #120a05 60%, #050201 100%)",
          color: "#f6efe1",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, opacity: 0.7, letterSpacing: 4 }}>
          <span>VAISH // BY ARYAMAN V. GUPTA</span>
          <span style={{ color: "#e89a4f" }}>● 00 // INDEX</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 240, lineHeight: 0.95, fontWeight: 700, letterSpacing: -6 }}>
            VAISH
          </div>
          <div style={{ fontSize: 36, fontStyle: "italic", opacity: 0.85, maxWidth: 900, lineHeight: 1.2 }}>
            A studio practice for the web that wants to be remembered.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, opacity: 0.55, letterSpacing: 2 }}>
          <span>DESIGNER // ENGINEER // WORLD-BUILDER</span>
          <span>SESSION V.001</span>
        </div>
      </div>
    ),
    size,
  )
}
