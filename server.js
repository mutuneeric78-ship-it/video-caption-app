const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// EXPORT ROUTE
app.post("/export", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No video uploaded");
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, "output.mp4");

    // TEMP: simple pass-through (replace with FFmpeg later)
    fs.copyFileSync(inputPath, outputPath);

    res.download(outputPath, "captioned-video.mp4", () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Processing failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
