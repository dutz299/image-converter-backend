const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 Minuten

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Ordner sicherstellen
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const sessions = {}; // temporär (MVP)

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg") cb(null, true);
    else cb(new Error("Nur JPG erlaubt"));
  }
});

// Upload Endpoint
app.post("/upload", upload.array("images", 20), (req, res) => {
  const sessionId = uuidv4();

sessions[sessionId] = {
  files: req.files,
  adCompleted: false,
  status: "uploaded",
  createdAt: Date.now()
};

  console.log("Upload:", sessionId);

  res.json({ sessionId });
});

// Werbe-Freigabe
app.post("/ad-complete", (req, res) => {
  const { sessionId } = req.body;

  if (!sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found" });
  }

  sessions[sessionId].adCompleted = true;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
const sharp = require("sharp");
const archiver = require("archiver");

// Konvertierung + ZIP-Download
app.get("/convert/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (!session.adCompleted) {
    return res.status(403).json({ error: "Ad not completed" });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=converted_images.zip");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  for (const file of session.files) {
    const inputPath = file.path;
    const outputName = file.originalname.replace(/\.jpe?g$/i, ".png");

    const buffer = await sharp(inputPath).png().toBuffer();
    archive.append(buffer, { name: outputName });
  }

  await archive.finalize();
});
function cleanupSessions() {
  const now = Date.now();

  for (const [sessionId, session] of Object.entries(sessions)) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      // Dateien löschen
      for (const file of session.files) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Fehler beim Löschen:", err.message);
        });
      }

      // Session löschen
      delete sessions[sessionId];
      console.log("Session gelöscht:", sessionId);
    }
  }
}
setInterval(cleanupSessions, 5 * 60 * 1000); // alle 5 Minuten
