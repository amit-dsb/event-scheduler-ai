import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { v4 as uuid_v4 } from 'uuid';

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
        const tokenObj1 = req.headers.get('Authorization')?.split("Bearer ")[1];

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


const authentication = (token: tokenAttributes) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_KEY,
            process.env.GOOGLE_SECRET,
            process.env.GOOGLE_CALLBACK
        );
        oauth2Client.setCredentials({ access_token: token.access_token });
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

export const POST = async (req: RequestCookies) => {
    let token = await getToken(req);

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