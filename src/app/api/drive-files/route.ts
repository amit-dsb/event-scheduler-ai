import { google } from 'googleapis';
import { NextResponse } from 'next/server';

interface RequestCookies extends Request {
    cookies: {
        get: (name: string) => { value: string } | undefined;
        getAll: () => Array<{ name: string; value: string }>;
        has: (name: string) => boolean;
        delete: (name: string) => void;
    };
}

export async function GET(req: RequestCookies) {
    const tokenObj = req.cookies.get('auth_token');
    const token = tokenObj ? JSON.parse(tokenObj.value) : {};

    if (!token) {
        return NextResponse.redirect('/login');
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_KEY,
            process.env.GOOGLE_SECRET,
            process.env.GOOGLE_CALLBACK
        );

        oauth2Client.setCredentials({ access_token: token.access_token });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const fileList = await drive.files.list();

        return NextResponse.json({
            files: fileList.data.files,
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}
