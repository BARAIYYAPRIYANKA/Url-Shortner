import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import { nanoid } from "nanoid";

const isUrlValid = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const urlsFilePath = path.join(__dirname, "urls.json");

// Ensure urls.json file exists
if (!fs.existsSync(urlsFilePath)) {
  fs.writeFileSync(urlsFilePath, JSON.stringify({}));
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "urlform.html"));
});

app.post("/shorten", (req, res) => {
  const { longUrl } = req.body;
  if (!isUrlValid(longUrl)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid longUrl",
    });
  }

  const shortUrl = nanoid(5);

  let urlsJson = {};
  try {
    const urlsFromFile = fs.readFileSync(urlsFilePath, { encoding: "utf-8" });
    urlsJson = JSON.parse(urlsFromFile);
  } catch (error) {
    console.error("Error reading URLs file:", error);
  }

  urlsJson[shortUrl] = longUrl;

  try {
    fs.writeFileSync(urlsFilePath, JSON.stringify(urlsJson));
  } catch (error) {
    console.error("Error writing URLs file:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }

  res.json({
    success: true,
    data: `http://localhost:${PORT}/${shortUrl}`,
  });
});

app.get("/:shortUrl", (req, res) => {
  const { shortUrl } = req.params;

  let urlsJson = {};
  try {
    const urls = fs.readFileSync(urlsFilePath, { encoding: "utf-8" });
    urlsJson = JSON.parse(urls);
  } catch (error) {
    console.error("Error reading URLs file:", error);
    return res.status(500).send("Internal Server Error");
  }

  const longUrl = urlsJson[shortUrl];
  if (!longUrl) {
    return res.status(404).send("Invalid Short URL");
  }

  console.log(`Redirecting to: ${longUrl}`);
  res.redirect(longUrl);
});

app.listen(PORT, () => {
  console.log(`Server is up and running at port ${PORT}`);
});
