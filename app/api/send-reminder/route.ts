import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, todoTitle, dueDate } = await request.json();

    if (!email || !todoTitle) {
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
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: white; margin: 0;">⏰ Task Reminder</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your task is due soon!</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 10px 0; color: #333;">📋 ${todoTitle}</h2>
              <p style="color: #666; margin: 0;"><strong>Due:</strong> ${dueTime}</p>
            </div>
            
            <div style="background: #fff4e5; border-left: 4px solid #ff9800; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #663c00;">
                <strong>⚠️ Reminder:</strong> This task is due in approximately 1 hour!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/todos" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Task →
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this because you have notifications enabled.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}