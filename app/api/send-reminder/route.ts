import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, todoTitle, dueDate } = await request.json();

    if (!email || !todoTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dueTime = dueDate ? new Date(dueDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : 'Soon';

    const { data, error } = await resend.emails.send({
      from: 'Todo App <onboarding@resend.dev>', // Change this to your verified domain
      to: [email],
      subject: '⏰ Task Reminder - Due in 1 Hour',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f7;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">⏰ Task Reminder</h1>
                        <p style="margin: 10px 0 0 0; color: #e8e8ff; font-size: 16px;">Your task is due soon!</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                          <h2 style="margin: 0 0 15px 0; color: #ffffff; font-size: 24px; font-weight: 600;">📋 ${todoTitle}</h2>
                          <p style="margin: 0; color: #ffffff; font-size: 16px; line-height: 1.6;">
                            <strong>Due:</strong> ${dueTime}
                          </p>
                        </div>
                        
                        <div style="background-color: #fff4e5; border-left: 4px solid #ff9800; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                          <p style="margin: 0; color: #663c00; font-size: 14px; line-height: 1.6;">
                            <strong>⚠️ Reminder:</strong> This task is due in approximately 1 hour. Make sure to complete it on time!
                          </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                          <a href="https://todo-app-supabase-lac.vercel.app/todos" 
                             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            View Task →
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                          Stay organized with <strong>Todo App</strong>
                        </p>
                        <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                          You're receiving this because you have notifications enabled.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}