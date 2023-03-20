import {google} from 'googleapis';
import http from 'http';
import url from 'url';
import opn from 'open';
import destroyer from 'server-destroy';
import { OAuth2Client } from 'google-auth-library';

'use strict';

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
let keys = {redirect_uris: ['http://localhost:8090'], client_id: CLIENT_ID, client_secret: CLIENT_SECRET};

// /**
//  * Create a new OAuth2 client with the configured keys.
//  */
const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);


/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({auth: oauth2Client});

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate(scopes: any[]) {
  return new Promise<OAuth2Client>((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url && req.url.indexOf('/?code=') > -1) {
            const qs = new url.URL(req.url, 'http://localhost:8090')
              .searchParams;
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            const code = qs.get('code')
            console.log("qs", code)
            if(code){
              const {tokens} = await oauth2Client.getToken(code);
              oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
              resolve(oauth2Client);
            }
            else{
              reject("code not present in search param of auth callback")
            }
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(8090, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, {wait: true}).then(async (cp) => {
          cp.unref()
        });
      });
    destroyer(server);
  });
}

async function runSample(token: string) {
  const chat = google.chat({
    version: 'v1',
    auth: oauth2Client
  })
  console.log("token", token)
  const res = await chat.spaces.list({
    // access_token: token,
    oauth_token: token
  })
  console.log(res.status)
  console.log(res.data)
  console.table(res.data);
}

const scopes = [
  'https://www.googleapis.com/auth/chat.spaces'
];

authenticate(scopes)
  .then(async (client: OAuth2Client) => {
    if(client.credentials.access_token){
      await runSample(client.credentials.access_token)
    }
  })
  .catch(console.error);