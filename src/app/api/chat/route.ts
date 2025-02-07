import { streamText, tool} from 'ai';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { BASE_URL } from '@/lib/constants';
import {openai} from '@ai-sdk/openai'
import { checkSlotAvailability, listEvents } from '../calendar-api/route';

export const maxDuration = 30;
//dsd

const getCookie = async () => {
    const cookieStore = await cookies();
    const authTokenCookie = cookieStore.get('auth_token');
    return authTokenCookie ? authTokenCookie.value : null;
}

// const checkSlotAvailabilityTool = async (timeMin: string, timeMax: string) => {
//     let cookie = await getCookie();
//     const data = await fetch(`http://localhost:3000/api/calendar-api?type=slot&timeMin=${timeMin}&timeMax=${timeMax}`, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${cookie ? cookie : ''}`
//         }
//     });
//     let result = await data.json();
//     return result.events;
// }


export const checkSlotAvailabilityTool = tool({
    description: "Check if a time slot is available in the primary calendar",
    parameters: z.object({
      startTime: z
        .string()
        .describe("Start time for checking availability in ISO format"),
      endTime: z
        .string()
        .describe("End time for checking availability in ISO format"),
    }),
    execute: async ({ startTime, endTime }): Promise<boolean> => {
      const events=  await checkSlotAvailability({ startTime, endTime });
      return Array.isArray(events) && events.length === 0;

    },
  });




const addNewEvents = async (summary: string, location: string | undefined, description: string | undefined, startTime: string, endTime: string) => {
    const cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: "POST",
        headers: {
            'Content-type': "applicaton/json",
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        },
        body: JSON.stringify({ summary, location, description, startTime, endTime })
    });
    const result = await data.json();
    return result;
}

const updateEvents = async (id: string, summary: string, location: string | undefined, description: string | undefined, startTime: string, endTime: string) => {
    const cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: "PUT",
        headers: {
            'Content-type': "applicaton/json",
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        },
        body: JSON.stringify({ id, summary, location, description, startTime, endTime })
    });
    const result = await data.json();
    return result;
}

const deleteEvents = async (id: string) => {
    const cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: "DELETE",
        headers: {
            'Content-type': "applicaton/json",
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        },
        body: JSON.stringify({ id })
    });
    const result = await data.json();
    return result;
}

export const getCurrentDate = () => {
    const date = new Date();
    const formattedDate = date.toISOString();
    return formattedDate;
};

export async function POST(req: Request) {
    const { messages } = await req.json();

    interface ToolParameters {
        startTime?: string;
        endTime?: string;
        summary?: string;
        location?: string;
        description?: string;
        id?: string;
        maxResults?: number;
    }

    interface ToolExecutionResult {
        events?: any;
        error?: string;
        data?: any;
        meetingLink?: string;
    }

    const result = streamText({
        model: openai("gpt-4o-mini"),
        system: process.env.SYSTEM_PROMPT,
        messages,
        maxSteps: 4,
        tools: {
            getAllEvents: tool({
                description: "List upcoming events from the primary calendar",
                parameters: z.object({
                    maxResults: z
                        .number()
                        .optional()
                        .describe("Maximum number of events to return"),
                }),
                execute: async ({ maxResults }: ToolParameters)=> {
                    const events = await listEvents({ maxResults });
                    return { events };
                },
            }),
            checkSlotAvailabilityTool: tool({
                description: "Check if a time slot is available in the insurance organization's primary calendar for a meeting not user's calendar",
                parameters: z.object({
                    startTime: z.string().describe("Start time for checking availability in ISO format"),
                    endTime: z.string().describe("End time for checking availability in ISO format"),
                }),
                execute: async ({ startTime, endTime }: ToolParameters) => {
                    console.log("timeMin", startTime);

                    try {
                        if (startTime && endTime) {
                            const eventsData = await checkSlotAvailability({ startTime, endTime });
                            return eventsData;
                        } else {
                            return { error: 'Start time and end time must be provided.' };
                        }
                    } catch (err) {
                        return { error: 'Failed to fetch events data.', err };
                    }
                }
            }),
            addNewEvents: tool({
                description: "This function will add a new event in the primary calendar of the user. You will get an object in return with properties message, data and meetingLink.",
                parameters: z.object({
                    summary: z.string().describe("Event summary"),
                    location: z.string().optional().describe("Event location"),
                    description: z.string().optional().describe("Event description"),
                    startTime: z.string().describe("Event start time in ISO format"),
                    endTime: z.string().describe("Event end time in ISO format"),
                }),
                execute: async ({ summary, location, description, startTime, endTime }: ToolParameters): Promise<ToolExecutionResult> => {
                    console.log('adding event');
                    try {
                        const eventsData = await addNewEvents(summary||"", location || '', description || '', startTime|| "", endTime||"");
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to add new event to calendar.', data: err };
                    }
                }
            }),
            updateEvents: tool({
                description: "This function will update or reschedule an event in the primary calendar of the user. You will get an object in return with properties message, data and meetingLink.",
                parameters: z.object({
                    id: z.string().describe("Event id"),
                    summary: z.string().describe("Event summary"),
                    location: z.string().optional().describe("Event location"),
                    description: z.string().optional().describe("Event description"),
                    startTime: z.string().describe("Event start time in ISO format"),
                    endTime: z.string().describe("Event end time in ISO format"),
                }),
                execute: async ({ id, summary, location, description, startTime, endTime }: ToolParameters): Promise<ToolExecutionResult> => {
                    try {
                        const eventsData = await updateEvents(id || "", summary || "", location || "", description || "", startTime || "", endTime || "");
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to update event to calendar.', data:err };
                    }
                }
            }),
            deleteEvents: tool({
                description: "This function will delete an event in the primary calendar of the user.",
                parameters: z.object({
                    id: z.string().describe("Event id"),
                }),
                execute: async ({ id }: ToolParameters): Promise<ToolExecutionResult> => {
                    try {
                        const eventsData = await deleteEvents(id || "");
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to delete event to calendar.', data:err };
                    }
                }
            }),
            getCurrentDateTool: tool({
                parameters: z.object({}),
                description: "Get the current date in the format YYYY-MM-DD",
                execute: async (): Promise<string> => {
                    return getCurrentDate();
                },
            }),
        }
    });

    return result.toDataStreamResponse();
}