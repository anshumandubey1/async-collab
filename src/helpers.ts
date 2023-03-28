import {events} from './jira-events.json'

export const queryParamConstructor = (object: object) => {
  return Object.entries(object).map(x => x.join('=')).join('&');
}

export const generateGoogleDocRequest = (body: string) => {
  const now = new Date();
  const text = `

${now.toUTCString()}

${body}

`
  const requests = [
    {
      insertText: {
        text,
        endOfSegmentLocation: {},
      },
    },
  ];
  return requests;
}

export const humaniseJiraEvent = (e: typeof events[number]) => {
  return JSON.stringify(e)
}