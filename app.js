const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadDestination = "./upload/images";
const metadataFile = "./upload/images/metadata.json";

fs.existsSync(uploadDestination) || fs.mkdirSync(uploadDestination);

if (!fs.existsSync(metadataFile)) {
  fs.writeFileSync(metadataFile, "[]");
}

let metadata = JSON.parse(fs.readFileSync(metadataFile));

let idCounter = metadata.reduce((maxId, item) => Math.max(maxId, item.id), 0);

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use("/image", express.static(uploadDestination));

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  const id = ++idCounter; // Increment the counter for each file
  const username = req.body.username || "Anonymous"; // Providing default username if not provided
  const animal_images = `http://localhost:4000/image/${req.file.filename}`;

  metadata.push({ id, username, animal_images });

  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

  res.json({ id, username, animal_images });
});

app.get("/metadata", (req, res) => {
  res.json(metadata);
});

app.delete("/image/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const imageIndex = metadata.findIndex((item) => item.id === id);
  if (imageIndex === -1) {
    return res.status(404).send("Image not found.");
  }

  const animal_images = metadata[imageIndex].animal_images;
  const filename = path.basename(animal_images);
  const imagePath = path.join(uploadDestination, filename);

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error(err); // Log the error details
      return res.status(500).send("Error deleting image file.");
    }

    metadata.splice(imageIndex, 1);
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    res.send("Image deleted successfully.");
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(4000, () => {
  console.log("Server is running on port 4000.");
});
