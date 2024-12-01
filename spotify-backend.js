const express = require('express');
const dotenv = require('dotenv');
const request = require('request');
const querystring = require('querystring');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

let accessToken = '';

app.get('/auth/spotify', (req, res) => {
  const scopes = 'user-read-playback-state user-modify-playback-state';
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: REDIRECT_URI,
  })}`;
  res.redirect(authUrl);
});

app.get('/auth/spotify/callback', (req, res) => {
  const code = req.query.code;

  const options = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    json: true,
  };

  request.post(options, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      console.error('Error authenticating Spotify:', error || body);
      return res.status(500).send('Authentication failed.');
    }
    accessToken = body.access_token;
    res.redirect('/music-page.html');
  });
});

app.post('/play', (req, res) => {
  const options = {
    url: 'https://api.spotify.com/v1/me/player/play',
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
  };

  request.put(options, (error, response) => {
    if (error || response.statusCode !== 204) {
      console.error('Error playing music:', error || response.body);
      return res.status(500).send('Error playing music.');
    }
    res.status(200).send('Music started.');
  });
});

app.post('/pause', (req, res) => {
  const options = {
    url: 'https://api.spotify.com/v1/me/player/pause',
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
  };

  request.put(options, (error, response) => {
    if (error || response.statusCode !== 204) {
      console.error('Error pausing music:', error || response.body);
      return res.status(500).send('Error pausing music.');
    }
    res.status(200).send('Music paused.');
  });
});

module.exports = app;
