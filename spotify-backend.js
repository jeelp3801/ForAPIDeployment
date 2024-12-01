const express = require("express");
const cors = require("cors");
const axios = require("axios");
const querystring = require("querystring");
require("dotenv").config();
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Your existing routes here...

// Optional: Fallback to index.html for other routes
app.get('/music', (req, res) => {
  res.sendFile(path.join(__dirname, 'music.html'));  // Adjust based on your file structure
});



const PORT = process.env.PORT || 3001;

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "https://forapideployment.onrender.com/callback-spotify";

let accessToken = "";

// 1. Redirect to Spotify login
app.get("/login", (req, res) => {
  const scope = "user-modify-playback-state user-read-playback-state";
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  })}`;
  res.redirect(authUrl);
});

// 2. Handle Spotify callback and exchange code for access token
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = response.data.access_token;
    res.send("Login successful! You can now control music.");
  } catch (error) {
    console.error("Error exchanging code for token:", error.response?.data || error);
    res.status(500).send("Failed to log in.");
  }
});

// 3. Start music
app.post("/start-music", async (req, res) => {
  try {
    if (!accessToken) return res.status(401).json({ error: "User not logged in." });
    const trackUri = "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp"; // Replace with your track URI
    await axios.put(
      "https://api.spotify.com/v1/me/player/play",
      { uris: [trackUri] },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json({ message: "Music started!" });
  } catch (error) {
    console.error("Error starting music:", error.response?.data || error);
    res.status(500).json({ error: "Failed to start music." });
  }
});

// 4. Stop music
app.post("/stop-music", async (req, res) => {
  try {
    if (!accessToken) return res.status(401).json({ error: "User not logged in." });
    await axios.put(
      "https://api.spotify.com/v1/me/player/pause",
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json({ message: "Music stopped!" });
  } catch (error) {
    console.error("Error stopping music:", error.response?.data || error);
    res.status(500).json({ error: "Failed to stop music." });
  }
});

app.listen(PORT, () => {
  console.log(`Spotify backend running on port ${PORT}`);
});
