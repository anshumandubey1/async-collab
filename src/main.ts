import dotenv from 'dotenv';
dotenv.config()

import express from "express";
import { WebClient } from "@slack/web-api";
import { getSummary } from "./openAi";

const app = express();
const PORT = 3000;

const client = new WebClient();
app.use(express.static("public"));
app.use(express.json());

app.get("/channels", async(req, res)=> {
  const token = req.headers.authorization
  if(!token) res.sendStatus(403)
  try {
    const response = await client.conversations.list({
      token,
    });
    
    if(response.ok){
      res.status(200).json({ data: response.channels?.filter(c => !c.is_private)})
    }else{
      throw new Error(response.error)
    }
  } catch (e) {
    res.status(500).json({error: e})
  }
})

app.post("/generateSummary", async(req,res) => {
  console.log("here")
  const token = req.headers.authorization
  if(!token) res.sendStatus(403)
  const channels = req.body.channels
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
      res.status(200).send(response)
    }else{
      throw new Error("Failed to generate summary")
    }
  } catch (e) {
    console.log(e)
    res.status(500).send((e as Error).message)
  }
})

app.get("/callback", async (req, res) => {
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
    res.redirect(`/?slackToken=${auth.access_token}`);
  } catch (e) {
    res.status(500).send((e as Error).message)
  }

});

app.listen(PORT, () => {
  console.log("listening at", PORT);
});
