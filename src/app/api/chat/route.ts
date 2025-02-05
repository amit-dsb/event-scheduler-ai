import { google } from '@ai-sdk/google';
import { streamText, tool} from 'ai';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { BASE_URL } from '@/lib/constants';
import {openai} from '@ai-sdk/openai'

export const maxDuration = 30;

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

const getAllEvents = async () => {
    let cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        }
    });
    let result = await data.json();
    return result.events;
}

const addNewEvents = async (summary: string, location: string | undefined, description: string | undefined, startTime: string, endTime: string) => {
    let cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: "POST",
        headers: {
            'Content-type': "applicaton/json",
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        },
        body: JSON.stringify({ summary, location, description, startTime, endTime })
    });
    let result = await data.json();
    return result;
}

const updateEvents = async (id: string, summary: string, location: string | undefined, description: string | undefined, startTime: string, endTime: string) => {
    let cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: "PUT",
        headers: {
            'Content-type': "applicaton/json",
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        },
        body: JSON.stringify({ id, summary, location, description, startTime, endTime })
    });
    let result = await data.json();
    return result;
}

const deleteEvents = async (id: string) => {
    let cookie = await getCookie();
    const data = await fetch(`${BASE_URL}/api/calendar-api`, {
        method: "DELETE",
        headers: {
            'Content-type': "applicaton/json",
            'Authorization': `Bearer ${cookie ? cookie : ''}`
        },
        body: JSON.stringify({ id })
    });
    let result = await data.json();
    return result;
}

export const getCurrentDate = () => {
    const date = new Date();
    const formattedDate = date.toISOString();
    return formattedDate;
};

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: openai("gpt-4o-mini"),
        system: process.env.SYSTEM_PROMPT,
        messages,
        maxSteps: 4,
        tools: {
            getAllEvents: tool({
                description: "This function will return all calender events of the user. It will return empty array if there are no events available.",
                parameters: z.object({}),
                execute: async () => {
                    try {
                        const eventsData = await getAllEvents();
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to fetch events data.' };
                    }
                }
            }),
            // checkSlotAvailabilityTool: tool({
            //     description: "This function will return all calender events of the user under a time slot given by the user. It will return empty array if there are no events available.",
            //     parameters: z.object({
            //         timeMin: z.string().describe("Start time for checking availability in ISO format"),
            //         timeMax: z.string().describe("End time for checking availability in ISO format"),
            //     }),
            //     execute: async ({timeMin, timeMax}) => {
            //         try {
            //             const eventsData = await checkSlotAvailabilityTool(timeMin, timeMax);
            //             return eventsData;
            //         } catch (err) {
            //             return { error: 'Failed to fetch events data.' };
            //         }
            //     }
            // }),
            addNewEvents: tool({
                description: "This function will add a new event in the primary calender of the user. You will get an object in return with properties message, data and meetingLink.",
                parameters: z.object({
                    summary: z.string().describe("Event summary"),
                    location: z.string().optional().describe("Event location"),
                    description: z.string().optional().describe("Event description"),
                    startTime: z.string().describe("Event start time in ISO format"),
                    endTime: z.string().describe("Event end time in ISO format"),
                }),
                execute: async ({ summary, location, description, startTime, endTime }) => {
                    try {
                        const eventsData = await addNewEvents(summary, location, description, startTime, endTime );
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to add new event to calendar.' };
                    }
                }
            }),
            updateEvents: tool({
                description: "This function will update or reschedule an event in the primary calender of the user. You will get an object in return with properties message, data and meetingLink.",
                parameters: z.object({
                    id: z.string().describe("Event id"),
                    summary: z.string().describe("Event summary"),
                    location: z.string().optional().describe("Event location"),
                    description: z.string().optional().describe("Event description"),
                    startTime: z.string().describe("Event start time in ISO format"),
                    endTime: z.string().describe("Event end time in ISO format"),
                }),
                execute: async ({ id, summary, location, description, startTime, endTime }) => {
                    try {
                        const eventsData = await updateEvents(id, summary, location, description, startTime, endTime );
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to update event to calendar.' };
                    }
                }
            }),
            deleteEvents: tool({
                description: "This function will delete an event in the primary calender of the user.",
                parameters: z.object({
                    id: z.string().describe("Event id"),
                }),
                execute: async ({ id }) => {
                    try {
                        const eventsData = await deleteEvents( id );
                        return eventsData;
                    } catch (err) {
                        return { error: 'Failed to delete event to calendar.' };
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