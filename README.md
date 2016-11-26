Spotify-Locally
======================

Node.js interface for the local Spotify API, based on
this article: http://cgbystrom.com/articles/deconstructing-spotifys-builtin-http-server/

The API interacts with the SpotifyWebHelper process via HTTP. For windows, the module checks whether SpotifyWebHelper.exe is running, and try to run it if not.

### Installing
```
npm install spotify-helper
```

### Example

```javascript
const SpotifyLocally = require('./spotifyLocally');

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