# VibeVote
<p align="center">
<img src="https://i.ibb.co/JxdKrs0/host-a-vibe-removebg-preview.png" width="500">
  
</p>

VibeVote is a web app that lets users create collaborative spotify playlists for parties or events. 
Attendees can vote on which songs to play next.
The host requires a Spotify Premium account. Guests can join without logging in!
<br>

## Screenshots
<div style="display: flex; justify-content: space-between;">
<img src="https://i.ibb.co/kBLMRpD/vibevote-desktop.png" style="width: 70%;">          
<img src="https://i.ibb.co/3FXKXMH/vibevote-phone.png" style="width: 20%;">
</div>



## Getting started
1. Clone the repo

``` 
git clone https://github.com/IdarDev/VibeVote.git
```

2. Install dependencies

```
npm install
```
3.  Register a spotify developer account.

```
https://developer.spotify.com/
```
4.  Create a .env file following the .env.example file provided.

```
DATABASE_URL=<your database url>
SPOTIFY_CLIENT_ID=<your spotify client id>
SPOTIFY_CLIENT_SECRET=<your spotify client secret>
SPOTIFY_CALLBACK_URL=<your spotify callback url>
```


5. Start the app

```
npm start 
```

## Tech Stack:

- Postgres database with Prisma as ORM
- Express.js for the server
- Passport.js for authentication
- Angular for the frontend
- For styling I used Tailwind and Angular Materials
- Socket.io for real-time communication
- Spotify Web API to edit playlist in realtime
- Spotify Web Playback SDK for playback

## Author
Idar Nigatu - [Github](https://github.com/IdarDev) - [LinkedIn](https://www.linkedin.com/in/idarnigatu/)

