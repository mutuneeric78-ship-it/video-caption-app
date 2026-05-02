const express = require("express");
const multer = require("multer");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();

// middleware
app.use(cors());
app.use(express.static("public"));

// health route
app.get("/api", (req, res) => {
  res.send("Video Caption API is running");
});

// upload config
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 }
});

const safeDelete = (file) => {
  if (fs.existsSync(file)) fs.unlinkSync(file);
};

// export video route
app.post("/export", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).send("No video uploaded");

  const videoPath = req.file.path;
  const captions = (req.body.captions || "").replace(/'/g, "\\'");
  const outputPath = path.join(__dirname, `output_${Date.now()}.mp4`);

  const text = captions.split("\n").join(" | ");

  ffmpeg(videoPath)
    .videoFilters({
      filter: "drawtext",
      options: {
        text: text,
        fontsize: 26,
        fontcolor: "white",
        x: "(w-text_w)/2",
        y: "h-100",
        box: 1,
        boxcolor: "black@0.5"
      }
    })
    .outputOptions("-preset veryfast")
    .output(outputPath)
    .on("end", () => {
      res.download(outputPath, () => {
        safeDelete(videoPath);
        safeDelete(outputPath);
      });
    })
    .on("error", (err) => {
      console.log(err);
      safeDelete(videoPath);
      safeDelete(outputPath);
      res.status(500).send("Processing failed");
    })
    .run();
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
