// server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: "*",
//     methods: ["POST", "GET", "DELETE", "OPTIONS"],
//   })
// );

// create audio directory if not exists
const audioDir = path.join(__dirname, "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log("Created audio directory:", audioDir);
}

// multer config to save file to folder ./audio
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, audioDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp
    const timestamp = Date.now();
    const originalName = file.originalname || "audio";
    const ext = path.extname(originalName) || ".wav";
    const baseName = path.basename(originalName, ext);
    const filename = `${baseName}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// --- CORS setup ---
// const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
//   res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   if (req.method === "OPTIONS") return res.sendStatus(204);
//   next();
// });
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET", "DELETE", "OPTIONS"],
  })
);

app.post("/api/stt", upload.single("audio"), async (req, res) => {
  let savedFilePath = null;
  try {
    const file = req.file;
    console.log(req.body.language);

    if (!["Kor", "Eng", "Jpn", "Chn"].includes(req.body.language)) {
      return res.status(400).send("Invalid language parameter");
    }
    const language = req.body.language || "Kor";
    if (!file) return res.status(400).send("Missing audio file");
    savedFilePath = file.path;
    const url = `https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=${encodeURIComponent(
      language
    )}`;
    // READ the file into a buffer
    const fileBuffer = fs.readFileSync(savedFilePath);

    const naverRes = await axios.post(url, fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": process.env.NAVER_CLIENT_SECRET,
      },
      timeout: 15000,
      responseType: "text",
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true,
    });

    res
      .status(naverRes.status)
      .type("text/plain")
      .send(
        typeof naverRes.data === "string"
          ? naverRes.data
          : JSON.stringify(naverRes.data)
      );
  } catch (err) {
    console.error("STT Error:", err.message);
    if (savedFilePath) {
      console.log(`Audio file saved at: ${savedFilePath}`);
    }
    const msg = err?.message || "Internal error";
    res.status(500).send(msg);
  }
});

// API to list all audio files with metadata
app.get("/api/audio/list", (req, res) => {
  try {
    const files = fs.readdirSync(audioDir);
    const audioFiles = files.map((file) => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    });
    res.json(audioFiles);
  } catch (err) {
    res.status(500).send("Error reading audio directory");
  }
});

// API to delete a specific audio file by filename
app.delete("/api/audio/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(audioDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    fs.unlinkSync(filePath);
    console.log(`Deleted audio file: ${filePath}`);
    res.send("File deleted successfully");
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).send("Error deleting file");
  }
});

app.get("/api/mp3-dummy", (req, res) => {
  const dummyMp3Path = path.join(__dirname, "luppy.mp3");
  if (fs.existsSync(dummyMp3Path)) {
    res.sendFile(dummyMp3Path);
  } else {
    res.status(404).send("Dummy MP3 file not found");
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    console.log(req.body);

    const URL = "https://56a2c5f17dd3.ngrok-free.app/chat";
    const { message } = req.body;

    if (!message) {
      return res.status(400).send("Missing message parameter");
    }

    const response = await axios.post(
      URL,
      { message },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error("TTS Error:", error.message);
    res.status(500).send(error?.message || "Internal error");
  }
});

// Health check
app.get("/health", (_req, res) => res.send("ok"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`STT proxy listening on http://localhost:${PORT}`);
  console.log(`Audio files will be saved to: ${audioDir}`);
});
