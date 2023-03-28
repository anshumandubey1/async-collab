# Setup

- Create a file `.env` in root directory
- Copy the following code in it:

```
OPEN_AI_APIKEY=XX

SLACK_CLIENT_ID=XX
SLACK_CLIENT_SECRET=XX

BASE_URL=XX
SECRET_KEY=XX

GOOGLE_CLIENT_ID=XX
GOOGLE_CLIENT_SECRET=XX

```

- Replace XX of each variable with appropriate value
- Start Server

> Note: Server needs to be restarted whenever .env is changed even on nodemon

> Note: Whenever Base URL changes, update .env file, slack redirect as well as google credentials redirect
