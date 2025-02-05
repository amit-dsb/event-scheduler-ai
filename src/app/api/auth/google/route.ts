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
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar',
        prompt: 'select_account',
    });

    return NextResponse.redirect(authUrl);
}
