import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_KEY,
        process.env.GOOGLE_SECRET,
        process.env.GOOGLE_CALLBACK
    );
    // google.calendar('v3')
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // This is essential for getting a refresh_token
        scope: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar',
        ],
        prompt: 'consent', // Ensure that 'consent' is included to get the refresh token
    });



    return NextResponse.redirect(authUrl);
}
