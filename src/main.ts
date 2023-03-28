import dotenv from 'dotenv';
dotenv.config()

import express, { Response } from "express";
import { WebClient } from "@slack/web-api";
import { getSummary } from "./openAi";
import { decrypt, encrypt } from './crypto';
import { addToFile, generateAuthUrl, getTokensFromCode, refreshAccessToken } from './googleDocs';
import { queryParamConstructor } from './helpers';

const app = express();
const PORT = 3000;

const client = new WebClient();
app.use(express.static("public"));
app.use(express.json());

app.get("/channels", async (req, res) => {
  try {
    let token = req.headers.authorization
    if(!token) return res.sendStatus(403)
    token = decrypt(token);
    const response = await client.conversations.list({
      token,
    });
    
    if(response.ok){
      return res.status(200).json({ data: response.channels?.filter(c => !c.is_private)})
    }else{
      throw new Error(response.error)
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({error: e})
  }
})

app.post("/generateSummary", async(req,res) => {
  console.log("here")
  let token: string | undefined = req.headers.authorization
  if(!token) return res.sendStatus(403)
  token = decrypt(token);
  const channels : any[] = req.body.channels
  if(!channels?.length) {
    res.status(400).send("channels is required body parameter")
  }
  try {
    const responses = []
    for await (const channel of channels) {
      const response = await client.conversations.history({channel, token}).catch((err) => {console.log(String(err))})
      if(response?.messages){
        responses.push(...response.messages.map(m => `${m.user}:${m.text}`))
      }
    }
    // console.log({responses})
    const summary =  await getSummary(responses)

    if(summary.data){
      const response = summary.data.choices.map(c => c.text).join(",")
      return res.status(200).send(response)
    }else{
      throw new Error("Failed to generate summary")
    }
  } catch (e) {
    console.log(e)
    return res.status(500).send((e as Error).message)
  }
})

app.get("/callback", async (req, res, next) => {
  try {
    console.log(req.url)
    const qs = new URL(req.url, process.env.BASE_URL).searchParams;
    const code = qs.get("code");
    const auth = await client.oauth.v2.access({
      code: code || '',
      client_id: process.env.SLACK_CLIENT_ID || '',
      client_secret: process.env.SLACK_CLIENT_SECRET || '',
      redirect_uri: process.env.BASE_URL+'/callback',
    });
    if(!auth?.access_token)
      throw new Error('Authentication Failed!')
    const token = encrypt(auth.access_token);
    res.redirect(`/?slackToken=${token}`);
  } catch (e) {
    next(e);
  }

});

app.get('/google', (_, res) => {
  res.redirect(generateAuthUrl());
})

app.get('/google/callback', async (req, res, next) => {
  try {
    const code = String(req.query.code);
    if(!code) {
      throw new Error('No Code Found!');
    }
    const tokens = await getTokensFromCode(code);
    if (!tokens.access_token || !tokens.refresh_token)
    throw new Error('Tokens not found')
    const params = {
      googleAccessToken: encrypt(tokens.access_token),
      googleRefreshToken: encrypt(tokens.refresh_token),
      googleTokenExpiryDate: tokens.expiry_date
    }
    res.redirect(`/?${queryParamConstructor(params)}`);
  } catch (e) {
    next(e);
  }
})

app.get("/google/refreshAccessToken", async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if(!token)
      throw new Error('Refresh Token not present!');
    const refreshToken = decrypt(token);
    // console.log(refreshToken, req.body)
    const {accessToken, expiryDate} = await refreshAccessToken(refreshToken);
    if (!accessToken || !expiryDate)
      throw new Error('Error Occured!')

    return res.status(200).json({
      googleAccessToken: encrypt(accessToken),
      googleTokenExpiryDate: expiryDate
    })
  } catch (e) {
    return next(e);
  }
});

app.post('/google/addToFile', async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if(!token)
      throw new Error('Access Token not present!');
    const accessToken = decrypt(token);
    // console.log(accessToken, req.body)
    const body = req.body.body;
    if(!body) {
      throw new Error('No body found!')
    }
    // console.log(body)
    const filename = `${process.env.SLACK_CLIENT_ID} Slack`
    const docLink = await addToFile(filename, body, accessToken);
    return res.status(200).json({
      data: {
        docLink
      }
    })
  } catch (e) {
    return next(e)
  }
})

app.use((err: Error, _: any, res :Response, __: any) => {
  console.error(err);
  return res.status(500).json({
    error: String(err)
  });
})

app.listen(PORT, () => {
  console.log("listening at", PORT);
});
