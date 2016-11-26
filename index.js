const axios = require('axios');
const q = require('q');
const _ = require('underscore');

const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];
const ORIGIN_HEADER = {Connection: 'keep-alive', Origin: 'https://open.spotify.com'};

class SpotifyLocally {
    /**
     * Main Constructor
     */
    constructor(headless=false, port=4370) {
        this.port = port;
        this.isOpen = headless;
        this.authenticated = false;
    }

    /**
     * Creates a random subdomain for the local spotify web service
     * @returns {string} - random subdomain
     * @private
     */
    _generateLocalHostname() {
        // Generate a random hostname under the .spotilocal.com domain
        const subdomain = _.sample('abcdefghijklmnopqrstuvwxyz', 10).join('');
        return `${subdomain}.spotilocal.com`;
    }

    /**
     * Method is used to authenticate to the local Spotify web service
     * @returns {Promise<Cancel>|*|Promise|promise} - Fetched CSRF && Oauth tokens
     * @private
     */
    _auth() {
        return this.openSpotifyClient().then(()=>{
            let deferredLogin = q.defer();
            if (this.authenticated) {
                deferredLogin.resolve();
            } else {
                return this._getOauthToken().then((oauthToken) => {
                    return this._getCsrfToken().then((csrfToken)=>{
                        this.authenticated = true;
                        this.oauthToken = oauthToken;
                        this.csrfToken = csrfToken;
                        deferredLogin.resolve();
                    }).catch(() => {
                        console.log('here');
                        // Check additional ports
                        if (!this.retySuccessful) {
                            return this.portScan().then(()=>{
                                this.retySuccessful = true;
                                // retry
                                return this._auth().then(()=>{
                                    deferredLogin.resolve();
                                }).catch(()=>{
                                    deferredLogin.reject();
                                });
                            }).catch(()=>{
                                deferredLogin.reject();
                            });
                        } else {
                            deferredLogin.reject();
                        }
                    });
                }).catch(() => {
                    deferredLogin.reject();
                })
            }
            return deferredLogin.promise;
        });
    }

    /**
     * Method fetches a Oauth token from local Spotify API
     * @returns {Promise.<String>|Promise<Error>}
     * @private
     */
    _getOauthToken() {
        return this.getJson('http://open.spotify.com/token').then((response) =>{
            if (response) {
                return response.t;
            }
        }).catch((err)=>{
            console.log('Unable to retrieve OauthToken', err);
        });
    }

    /**
     * Method fetches a CSRF token from local Spotify API
     * @returns {Promise.<String>|Promise<Error>}
     * @private
     */
    _getCsrfToken() {
        return q.promise((resolve, reject)=>{
            const url = this.getUrl('/simplecsrf/token.json')
            // Requires Origin header to be set to generate the CSRF token.
            return this.getJson(url, {}, ORIGIN_HEADER).then((response) => {
                if (response) {
                    resolve(response.token);
                }
            }).catch((err)=>{
                console.log('Unable to retrieve CSRF', err);
                reject(err);
            });
        });

    }

    /**
     * Method is an HTTP get wrapper
     * @param url - URL to call
     * @param params - HTTP parameters
     * @param headers - HTTP headers
     * @returns {Promise<HTTP>}
     */
    getJson(url, params={}, headers={}) {
        return q.promise((resolve, reject)=>{
            const method = 'get';
            return axios({
                url,
                method,
                headers,
                params
            }).then((response) => {
                if (response && response.data) {
                    resolve(response.data);
                } else {
                    reject(new Error('No response data returned.'))
                }
            }).catch((err) => {
                reject(err);
            });
        });

    }

    /**
     * URL constructor for local Spotify web service
     * @param resource - URL resource
     * @returns {string} - Fully qualified url
     */
    getUrl(resource) {
        const hostname = this._generateLocalHostname();
        return `https://${hostname}:${this.port}${resource}`;
    }

    /**
     * Fetches Spotify client version
     * @returns {Promise.<HTTP>}
     */
    getVersion() {
        const url = this.getUrl('/service/version.json');
        return this.getJson(url, {'service': 'remote'}, ORIGIN_HEADER)
    }

    /**
     * Methods is responsible for fetching current track metadata
     * @param returnafter - Adds a delayed response from the Spotify service
     * @param return_on - Return types
     * @returns {Promise<HTTP>}
     */
    getStatus(returnafter=5, return_on=DEFAULT_RETURN_ON) {
        return this._auth().then(()=>{
            const url = this.getUrl('/remote/status.json');
            const params = {
                oauth: this.oauthToken,
                csrf: this.csrfToken,
                returnafter,
                returnon: `,${return_on}`
            };
            return this.getJson(url, params, ORIGIN_HEADER);
        })
    }

    /**
     * Method is responsible for pausing the current track
     * @param pause - Pause toggle
     * @returns {Promise<HTTP>}
     */
    pause(pause=true) {
        return this._auth().then(()=>{
            const params = {
                oauth: this.oauthToken,
                csrf: this.csrfToken,
                pause: (pause) ? 'true' : 'false'
            };
            const url = this.getUrl('/remote/pause.json');
            return this.getJson(url, params, ORIGIN_HEADER);
        });
    }

    /**
     * Method is responsible for unpausing the current track
     * @returns {Promise<HTTP>}
     */
    unpause() {
        return this.pause(false);
    }

    /**
     * Method will play a specific Spotify track
     * @param spotify_uri
     * @returns {Promise<HTTP>}
     */
    play(spotify_uri) {
        return this._auth().then(()=>{
            const params = {
                oauth: this.oauthTokn,
                csrf: this.csrfToken,
                'uri': spotify_uri,
                'context': spotify_uri,
            };
            const url = this.getUrl('/remote/play.json');
            return this.getJson(url, params, RIGIN_HEADER);
        });
    }

    /**
     * Method forces Spotify client to open
     * @returns {Promise.<T>|Promise<R>}
     */
    openSpotifyClient() {
        let deferredOpen = q.defer();
        if(this.isOpen) {
            deferredOpen.resolve();
        } else {
            const url = this.getUrl('/remote/open.json');
            this.getJson(url, {}, ORIGIN_HEADER).then((response) => {
                if (response.running) {
                    this.isOpen = true;
                    deferredOpen.resolve();
                } else {
                    deferredOpen.reject();
                }
            }).catch((err)=>{
                console.log('Unable to open client', err);
                deferredOpen.reject();
            });
        }
        return deferredOpen.promise;

    }

    /**
     * Method looks for additional know ports used by Spotify
     * @param currentPort - starting port to check
     * @returns {Promise}
     */
    portScan(currentPort=4350) {
        const deferredPortScan = q.defer();
        const startPort = 4350;
        const endPort = 4500;

        console.log('Attempting additional known ports', currentPort);
        this.port = currentPort;
        return this.getVersion().then(()=>{
            this.isFound = true;
            deferredPortScan.resolve();
        }).catch((error)=>{
            if(currentPort > endPort) {
                deferredPortScan.reject(new Error('Unable to find web client.'))
            } else {
                return this.portScan(currentPort+1);
            }
        });

        return deferredPortScan.promise;
    }
}

module.exports = SpotifyLocally;