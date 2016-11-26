Spotify-Locally
======================

Node.js interface for the local Spotify API, based on
this article: http://cgbystrom.com/articles/deconstructing-spotifys-builtin-http-server/

### Installing
```
npm install spotify-locally
```

### Example

```javascript
const SpotifyLocally = require('spotify-locally');

let spotify = new SpotifyLocally();

spotify.getStatus().then((status)=>{
    console.log(status);
}).catch((err)=>{
    console.log(err);
});
```

### API

This module exposes the SpotifyWebHelper object, which exposes  the following methods:

 - **getStatus** -  get current status information (name of song/artist which is currently playing, etc..)
 - **pause** - pause currently playing song
 - **unpause** - unpause currently playing song
 - **play** - play the given spotify url
 - **Constructor** - Creates a new Spotify Service object,
   default port to communicate with the SpotifyWebHelper is 4370, other port can be specified when creating the object.

### Bugs
You can report bugs with the repo issue tracker.