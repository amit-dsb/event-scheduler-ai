import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

const getWeatherData = async (latitude: number, longitude: number) => {
  const data = await fetch(`https://api.pirateweather.net/forecast/cECPzUYiEPLXDOH4Jayhzr4TvC548y8R/${latitude},${longitude}`);
  return await data.json();
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash-exp'),
    system: 'You are a friendly weather data assistant. You work is only related to weather, do not tell anything else. Utilize the available tools to gather additional details. Do not answer questions that are outside of this context. Ensure that all times are referenced in the Indian time zone.',
    messages,
    maxSteps: 4,
    tools: {
      getWeatherData: tool({
        description: "This function will return all weather data available for a latitude and longitude",
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number()
        }),
        execute: async ({latitude, longitude}) => {
          try {
            const weatherData = await getWeatherData(latitude, longitude);
            return weatherData;
          } catch (err) {
            return { error: 'Failed to fetch weather data.' };
          }
        }
      }),
      getLocation: tool({
        description: 'Get the user location. Always ask for confirmation before using this tool.',
        parameters: z.object({})
      }),
    }
  });

  return result.toDataStreamResponse();
}