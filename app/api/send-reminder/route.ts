import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, todoTask, dueDate } = await request.json();

    if (!email || !todoTask) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const dueTime = dueDate 
      ? new Date(dueDate).toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Soon';

    const { data, error } = await resend.emails.send({
      from: 'Todo App <onboarding@resend.dev>',
      to: [email],
      subject: '⏰ Task Reminder - Due in 1 Hour',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f7;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Task Reminder</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your task is due soon!</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">📋 ${todoTask}</h2>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <p style="color: #666; margin: 0; font-size: 14px;">
                  <strong style="color: #333;">Due Date:</strong> ${dueTime}
                </p>
              </div>
            </div>
            
            <div style="background: #fff4e5; border-left: 4px solid #ff9800; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #663c00; font-size: 14px;">
                <strong>⚠️ Important:</strong> This task is due in approximately 1 hour. Don't forget to complete it!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/todos" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                View Task →
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this because you have notifications enabled for your Todo App.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 Todo App. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}