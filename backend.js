const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config(); // Load environment variables

const app = express();
const port = 3000;

// Enable CORS for frontend to access the API
app.use(cors());

// Serve static files for the frontend
//app.use(express.static(path.join(__dirname, '../')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));  // Serve static files from the root folder

// Set up OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Scopes for Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Route to start the OAuth flow
app.get('/auth/google', (req, res) => {
  const currentPage = req.headers.referer || '/calendarSync.html'; // Fallback to default
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: currentPage, // Pass the current page URL
  });
  res.redirect(authUrl);
});

// OAuth2 callback route
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('No authorization code received.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log('Tokens received:', tokens);

    // Redirect back to the task page or calendar sync page
    res.redirect('/calendar-sync'); // Adjust path as needed
  } catch (error) {
    console.error('Error during OAuth2 token exchange:', error);
    res.status(500).send('Error during authorization: ' + error.message);
  }
});

// Endpoint to check login status
app.get('/auth/status', (req, res) => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

// Endpoint to fetch calendar events
app.get('/events', async (req, res) => {
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
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
