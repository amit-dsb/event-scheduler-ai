import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const urlParams = new URL(req.url).searchParams;
  const code = urlParams.get('code');
  //   const state = urlParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  //   console.log(state, "state=====backend")

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_KEY,
      process.env.GOOGLE_SECRET,
      process.env.GOOGLE_CALLBACK
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: 'v2',
      auth: oauth2Client,
    });

    const userInfo = await oauth2.userinfo.get();

    cookieStore.set({
      name: 'auth_token',
      value: JSON.stringify(tokens) || '',
      httpOnly: true,
      path: '/',
      // maxAge: 60 * 60 * 24 * 365 * 1000,
      // expires: new Date(Date.now() + 60 * 60 * 24 * 365 * 1000),
    })

    cookieStore.set({
      name: "refresh_token",
      value: tokens.refresh_token || '',
      httpOnly: true,
      path: '/',
    })

    cookieStore.set({
      name: "expiry_date",
      value: tokens.expiry_date ? tokens.expiry_date.toString() : '',
      httpOnly: true,
      path: '/',
    })

    cookieStore.set({
      name: 'user_info',
      value: JSON.stringify(userInfo) || '',
      httpOnly: true,
      path: '/',
      // maxAge: 60 * 60 * 24 * 365 * 1000,
      // expires: new Date(Date.now() + 60 * 60 * 24 * 365 * 1000),
    })

    return NextResponse.redirect(new URL('/chat-bot', req.url));
    // return NextResponse.json({
    //   message: 'Successfully authenticated',
    //   files: fileList.data.files,
    // });

  } catch (error) {
    console.error('Error during token exchange or API request:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
}
