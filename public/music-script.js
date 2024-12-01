document.addEventListener('DOMContentLoaded', () => {
    const loginSpotify = document.getElementById('loginSpotify');
    const playMusic = document.getElementById('playMusic');
    const pauseMusic = document.getElementById('pauseMusic');
    const status = document.getElementById('status');
  
    loginSpotify.addEventListener('click', () => {
      window.location.href = '/auth/spotify';
    });
  
    playMusic.addEventListener('click', async () => {
      try {
        const response = await fetch('/play', { method: 'POST' });
        if (response.ok) {
          console.log('Music started.');
        }
      } catch (error) {
        console.error('Error playing music:', error);
      }
    });
  
    pauseMusic.addEventListener('click', async () => {
      try {
        const response = await fetch('/pause', { method: 'POST' });
        if (response.ok) {
          console.log('Music paused.');
        }
      } catch (error) {
        console.error('Error pausing music:', error);
      }
    });
  });
  