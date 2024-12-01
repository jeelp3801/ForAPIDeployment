const API_URL = "https://forapideployment.onrender.com";

// Redirect the user to Spotify's login page
document.getElementById("login").addEventListener("click", () => {
  window.location.href = `${API_URL}/login`;
});

document.getElementById("start-music").addEventListener("click", () => {
  fetch(`${API_URL}/start-music`, { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      console.log("Music started:", data);
      alert("Music started!");
    })
    .catch((error) => {
      console.error("Error starting music:", error);
      alert("Failed to start music.");
    });
});

document.getElementById("stop-music").addEventListener("click", () => {
  fetch(`${API_URL}/stop-music`, { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      console.log("Music stopped:", data);
      alert("Music stopped!");
    })
    .catch((error) => {
      console.error("Error stopping music:", error);
      alert("Failed to stop music.");
    });
});
