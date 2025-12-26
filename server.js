import { useState } from "react";

const API_BASE = "https://image-converter-backend-kvz6.onrender.com";

// 🔁 Social Bar (aktiv)
const SOCIAL_BAR_SCRIPT =
  "https://pl28339042.effectivegatecpm.com/89/f4/4d/89f44d1ee7fda7ebb0ab5a814df9d988.js";

// 🔁 Interstitial (später eintragen)
const INTERSTITIAL_SCRIPT = ""; // leer lassen, bis freigeschaltet

function App() {
  const [files, setFiles] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [adUnlocked, setAdUnlocked] = useState(false);

  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [countdown, setCountdown] = useState(14);

  // =====================
  // 📤 UPLOAD
  // =====================
  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setSessionId(data.sessionId);
  };

  // =====================
  // 🎥 WERBUNG + FREIGABE
  // =====================
  const watchAd = () => {
    if (!sessionId || adUnlocked) return;

    setShowAdOverlay(true);
    setCountdown(14);

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });

    // 1️⃣ Interstitial versuchen (falls vorhanden)
    const tryInterstitial = INTERSTITIAL_SCRIPT
      ? loadScript(INTERSTITIAL_SCRIPT)
      : Promise.reject();

    // 2️⃣ Fallback → Social Bar
    tryInterstitial.catch(() => loadScript(SOCIAL_BAR_SCRIPT));

    // Countdown
    const interval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    // Nach 14 Sekunden freischalten
    setTimeout(async () => {
      clearInterval(interval);

      await fetch(`${API_BASE}/ad-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      setAdUnlocked(true);
      setShowAdOverlay(false);
    }, 14000);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Image Converter</h1>

      <input
        type="file"
        multiple
        accept="image/jpeg"
        onChange={(e) => setFiles([...e.target.files])}
      />

      <br />
      <br />

      <button onClick={handleUpload} disabled={files.length === 0}>
        Dateien hochladen
      </button>

      <br />
      <br />

      <button onClick={watchAd} disabled={!sessionId || adUnlocked}>
        Werbung ansehen & freischalten
      </button>

      <br />
      <br />

      <button
        disabled={!adUnlocked}
        onClick={() =>
          (window.location.href = `${API_BASE}/convert/${sessionId}`)
        }
      >
        Konvertierung starten
      </button>

      {/* 🔒 Ad Overlay */}
      {showAdOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h2>Bitte kurze Werbung ansehen</h2>
            <p>Dein Download wird danach freigeschaltet.</p>

            <div style={{ fontSize: 36, margin: "20px 0" }}>
              {countdown > 0 ? countdown : "✔"}
            </div>

            <p style={{ fontSize: 12, opacity: 0.8 }}>
              Falls keine Werbung erscheint, bitte kurz den Adblocker deaktivieren.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
