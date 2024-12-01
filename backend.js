const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const googleBackend = require('./backend.js'); // Existing Google Calendar backend
const spotifyBackend = require('./spotify-backend.js'); // Spotify backend

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000; // Use environment-defined port

// Enable CORS to allow frontend access to the API
app.use(cors());

// Integrate Google and Spotify backends
app.use(googleBackend);
app.use(spotifyBackend);

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up OAuth2 client with credentials from .env
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI // Redirect URI specified in .env file
);

// Scopes for accessing Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Route to start the OAuth flow
app.get('/auth/google', (req, res) => {
  const currentPage = req.headers.referer || '/calendarSync.html'; // Get current page URL or fallback to default
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: currentPage, // Pass the current page URL to use after successful auth
  });
  res.redirect(authUrl); // Redirect to Google's OAuth2 authorization page
});

// OAuth2 callback route to exchange code for tokens
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query; // Get the authorization code from the query

  if (!code) {
    return res.status(400).send('No authorization code received.');
  }

  try {
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens); // Set the credentials for the client

    console.log('Tokens received:', tokens);

    // Redirect back to the original page (or calendar sync page)
    const redirectPage = req.query.state || '/calendarSync.html'; // Use the state parameter to redirect back
    res.redirect(redirectPage); // Redirect the user after successful authentication
  } catch (error) {
    console.error('Error during OAuth2 token exchange:', error);
    res.status(500).send('Error during authorization: ' + error.message);
  }
});

// Endpoint to check if the user is logged in
app.get('/auth/status', (req, res) => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    res.json({ loggedIn: true }); // If the user is authenticated
  } else {
    res.json({ loggedIn: false }); // If not authenticated
  }
});

// Endpoint to fetch calendar events
app.get('/events', async (req, res) => {
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'User not authenticated' }); // If user is not authenticated
  }

  try {
    // Access Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    // Send events data or a message if no events are found
    res.json(events.length ? events : { message: 'No upcoming events found.' });
  } catch (err) {
    console.error('Error retrieving events:', err);
    res.status(500).json({ error: 'Error retrieving events' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
