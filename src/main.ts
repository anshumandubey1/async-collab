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
      res.send(response.channels?.filter(c => !c.is_private))
    }else{
      res.send(response.error)
    }
  } catch (e) {}
})

app.post("/generateSummary", async(req,res) => {
  console.log("here")
  const token = req.headers.authorization
  if(!token) res.sendStatus(403)
  const channels = req.body.channels
  if(!channels.length) {
    res.sendStatus(400)
    res.send("channels is required body parameter")
  }
  try {
    const responses = []
    for await (const channel of channels) {
      const response = await client.conversations.history({channel, token})
      if(response.messages){
        responses.push(...response.messages.map(m => `${m.user}:${m.text}`))
      }
    }
    
    const summary =  await getSummary(responses)
    
    if(summary.data){
      const response = summary.data.choices.map(c => c.text).join(",")
      res.sendStatus(200)
      res.send(response)
    }else{
      res.sendStatus(500)
      res.send("Failed to generate summary")
    }
  } catch (e) {
    res.sendStatus(500)
    res.send((e as Error).message)
  }
})

app.get("/", async (req, res) => {
  console.log(req.url)
  const qs = new URL(req.url, "https://7771-160-238-78-161.in.ngrok.io").searchParams;
  const code = qs.get("code");
  const auth = await client.oauth.v2.access({
    code: code || '',
    client_id: process.env.SLACK_CLIENT_ID || '',
    client_secret: process.env.SLACK_CLIENT_SECRET || '',
    redirect_uri: "https://7771-160-238-78-161.in.ngrok.io",
  });
  res.send({token: auth.access_token})
});

app.listen(PORT, () => {
  console.log("listening at", PORT);
});
