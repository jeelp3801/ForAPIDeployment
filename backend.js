const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
require("dotenv").config();
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Your existing routes here...

// Optional: Fallback to index.html for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const PORT = process.env.PORT || 3002;

// Google OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://forapideployment.onrender.com/callback-calendar"
);

// 1. Redirect to Google authorization
app.get("/authorize-calendar", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(authUrl);
});

// 2. Handle Google OAuth2 callback
app.get("/callback-calendar", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No authorization code provided.");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send("Authorization successful! You can now fetch events.");
  } catch (error) {
    console.error("Error exchanging code for tokens:", error.response?.data || error);
    res.status(500).send("Failed to authorize.");
  }
});

// 3. List Google Calendar events
app.get("/list-events", async (req, res) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items.map(
      (event) => `${event.summary} at ${event.start.dateTime || event.start.date}`
    );
    res.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch calendar events." });
  }
});

app.listen(PORT, () => {
  console.log(`Google Calendar backend running on port ${PORT}`);
});
