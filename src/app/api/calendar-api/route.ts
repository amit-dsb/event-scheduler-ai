import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { v4 as uuid_v4 } from 'uuid';
import { checkSlotAvailabilityTool } from '../chat/route';
import { z } from 'zod';
import dotenv from 'dotenv';
// Constants
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const calendar = google.calendar("v3");
const calendarId = process.env.CALENDAR_ID || "ravi.chopra@designingsolutions.co.in";

dotenv.config();
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // To handle newline characters correctly
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

export async function authenticate() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: GOOGLE_PROJECT_ID,
          private_key: GOOGLE_PRIVATE_KEY,
          client_email: GOOGLE_CLIENT_EMAIL,
        },
        scopes: SCOPES,
      });
  
      return await auth.getClient();
    } catch (error) {
      console.error("Error during authentication:", error);
      throw error;
    }
  }

interface RequestCookies extends Request {
    cookies: {
        get: (name: string) => { value: string } | undefined;
        getAll: () => Array<{ name: string; value: string }>;
        has: (name: string) => boolean;
        delete: (name: string) => void;
    };
}

interface tokenAttributes {
    access_token: string,
    refresh_token: string,
    scope: string,
    token_type: string,
    id_token: string,
    expiry_date: number
}

const getToken = (req: RequestCookies) => {
    try {
        const tokenObj = req.cookies.get('auth_token');
        console.log(tokenObj,"tokenObj")
        const tokenObj1 = req.headers.get('Authorization')?.split("Bearer ")[1];
        console.log(tokenObj1,"tokenObj1")

        if (!tokenObj && !tokenObj1) {
            return NextResponse.redirect(new URL('/login', req.url));
        } else {
            const token = tokenObj
                ? JSON.parse(tokenObj.value)
                : tokenObj1
                    ? JSON.parse(tokenObj1)
                    : null;
            return token;
        }
    } catch (err) {
        return NextResponse.redirect(new URL('/login', req.url));
    }
}

// async function authenticateUser() {
//     const SCOPES = ["https://www.googleapis.com/auth/calendar"];
//     const auth = new google.auth.GoogleAuth({
//         keyFile: "./credentials.json",
//         scopes: SCOPES,
//     });
//     return await auth.getClient();
// }


const authentication = async (token: tokenAttributes) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_KEY,
            process.env.GOOGLE_SECRET,
            process.env.GOOGLE_CALLBACK
        );
        // Make sure to include the 'offline' scope to receive a refresh_token
        const scopes = ['https://www.googleapis.com/auth/userinfo.profile', 'offline'];

        // Generate the auth URL
        const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        });

        console.log(authUrl, 'OAuth2 Auth URL');  // Share this URL with the user to authenticate

        
        oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token, expiry_date: token.expiry_date });
        const currentTime = Date.now(); // Current time in seconds


        // check if accessToken is expired if expired then do oauthClient.refreshAccessToken() to get new token
        console.log(oauth2Client.credentials,"oauth2Client.credentials")
        
        const accessTokenExpirationTime = oauth2Client.credentials.expiry_date ? oauth2Client.credentials.expiry_date : null;
        console.log(accessTokenExpirationTime, currentTime, "accessTokenExpirationTime, currentTime")
        
        if (accessTokenExpirationTime && accessTokenExpirationTime < currentTime) {
            console.log("Access token expired. Refreshing...");
            // Refresh the access token using the refresh token
            const { credentials } = await oauth2Client.refreshAccessToken();
            // Set the new credentials with the refreshed access token
            oauth2Client.setCredentials(credentials);
            console.log('Access token refreshed.');
        } else if (!accessTokenExpirationTime) {
            console.log("No expiration date found, refreshing token...");
            // If no expiration date is found, refresh the token to get a new one
            const { credentials } = await oauth2Client.refreshAccessToken();
            // Set the new credentials with the refreshed access token
            oauth2Client.setCredentials(credentials);
            console.log('Access token refreshed.');
        }

        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        return { calendar, oauth2Client };
    } catch (err) {
        console.log(`Error in authentication: ${err}`);
        return { calendar: null, oauth2Client: null };
    }
}

export const GET = async (req: RequestCookies) => {
    let token = await getToken(req);
    // const { searchParams } = new URL(req.url);
    // const type = searchParams.get('type');
    // const timeMin = searchParams.get('timeMin');
    // const timeMax = searchParams.get('timeMax');

    try {

        let { calendar, oauth2Client } = await authentication(token);
        if (!calendar || !oauth2Client) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // if (type === "all") {
        //     const eventsList = await calendar.events.list({
        //         auth: oauth2Client,
        //         calendarId: 'primary',
        //         timeMin: (new Date()).toISOString(),
        //         maxResults: 10,
        //         singleEvents: true,
        //         orderBy: 'startTime',
        //     });
        //     return NextResponse.json({
        //         success: true,
        //         events: eventsList.data.items,
        //     }, { status: 200 });
        // } else {
        //     const eventsList = await calendar.events.list({
        //         // auth: oauth2Client,
        //         calendarId: 'primary',
        //         // timeMin: timeMin,
        //         // timeMax: timeMax,
        //         singleEvents: true,
        //     });
        //     return NextResponse.json({
        //         success: true,
        //         events: eventsList.data.items,
        //     }, { status: 200 });
        // }


        const eventsList = await calendar.events.list({
            auth: oauth2Client,
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return NextResponse.json({
            success: true,
            events: eventsList.data.items,
        }, { status: 200 });


    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
    }
}

export type checkSlotAvailabilityToolParams = z.infer<
  typeof checkSlotAvailabilityTool.parameters
>;

export async function checkSlotAvailability(params: checkSlotAvailabilityToolParams) {
    try {
        
    
    console.log(params,"checking availability");
    const auth = await authenticate();
    console.log("auth", auth);
    const response = await calendar.events.list({
      auth,
      calendarId: calendarId,
      timeMin: params.startTime,
      timeMax: params.endTime,
      singleEvents: true,
    });
  
    const events = response.data.items;
    console.log("events", events);
  
    return !events || events.length === 0; // Return true if no events found, meaning the slot is available
} catch (error) {
 console.error('Error fetching events:', error);       
}
  }

// Function to list events
export async function listEvents(params: any) {
    const auth = await authenticate();
    const res = await calendar.events.list({
      auth,
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      maxResults: params.maxResults || 10,
      singleEvents: true,
      orderBy: "startTime",
    });
  
    const events = res.data.items;
    if (!events || events.length === 0) {
      return "No upcoming events found.";
    }
  
    return events.map((event) => ({
      start: event.start.dateTime || event.start.date,
      summary: event.summary,
    }));
  }


export const POST = async (req: RequestCookies) => {
    let token = await getToken(req);
    console.log("token",token)
    console.log("api calling")

    try {
        let { calendar, oauth2Client } = await authentication(token);
        let { summary, location, description, startTime, endTime } = await req.json();

        if (!calendar || !oauth2Client) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const event = {
            summary: summary,
            location: location || '',
            description: description,
            start: {
                dateTime: startTime,
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: endTime,
                timeZone: 'Asia/Kolkata',
            },
            conferenceData: {
                createRequest: {
                    requestId: await uuid_v4(),
                }
            },
            attendees: [
                { email: process.env.ATTENDEE_EMAIL },
            ]
        };

        // const auth = await authenticateUser();
        let response = await calendar.events.insert({
            calendarId: 'primary',
            auth: oauth2Client,
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            requestBody: event,
        });

        return NextResponse.json({
            success: true,
            message: 'Event added successfully',
            data: response.data,
            meetingLink: response.data.hangoutLink
        }, { status: 200 });
    } catch (err) {
        console.log(err,"error post api")
        return NextResponse.json({ success: false, error: 'Failed to add events' }, { status: 500 });
    }
}

export const PUT = async (req: RequestCookies) => {
    let token = await getToken(req);

    try {
        let { calendar, oauth2Client } = await authentication(token);
        let { id, summary, location, description, startTime, endTime } = await req.json();
        if (!calendar) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const updatedEvent = {
            summary: summary,
            location: location || '',
            description: description,
            start: {
                dateTime: startTime,
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: endTime,
                timeZone: 'Asia/Kolkata',
            },
            conferenceData: {
                createRequest: {
                    requestId: await uuid_v4(),
                }
            },
            attendees: [
                { email: process.env.ATTENDEE_EMAIL },
            ]
        };

        await calendar.events.update(
            {
                calendarId: 'primary',
                sendUpdates: 'all',
                conferenceDataVersion: 1,
                eventId: id,
                requestBody: updatedEvent,
            })

        return NextResponse.json({
            success: true,
            events: 'Event updated successfully',
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ success: false, error: 'Failed to update events' }, { status: 500 });
    }
}

export const DELETE = async (req: RequestCookies) => {
    let token = await getToken(req);

    try {
        let { id } = await req.json();
        let { calendar, oauth2Client } = await authentication(token);
        if (!calendar) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        await calendar.events.delete(
            {
                calendarId: 'primary',
                eventId: id,
            })

        return NextResponse.json({
            success: true,
            events: 'Event deleted successfully',
        }, { status: 200 });

    } catch (err) {
        console.log(err)
        return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 });
    }
}



