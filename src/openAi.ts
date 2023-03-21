import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_APIKEY,
});
const openai = new OpenAIApi(configuration);

export const getSummary = async (messages: string[]) => {
  const prompt =  "Convert my short hand into a first-hand account of the meeting:\n\n"
  const dialogueString = messages.join("\n")
  return await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt + dialogueString,
    temperature: 0,
    max_tokens: 1048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
}