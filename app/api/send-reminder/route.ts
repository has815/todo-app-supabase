import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userEmail, todoTitle, dueDate } = await request.json();

    if (!userEmail || !todoTitle || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const formattedDate = new Date(dueDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: 'Todo App <onboarding@resend.dev>',
      to: [userEmail],
      subject: `⏰ Reminder: ${todoTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px;
                border-radius: 10px;
                color: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .icon {
                font-size: 48px;
                margin-bottom: 10px;
              }
              .content {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
              }
              .todo-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
              }
              .due-date {
                font-size: 16px;
                opacity: 0.9;
                margin-bottom: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                opacity: 0.8;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">⏰</div>
                <h1>Todo Reminder</h1>
              </div>
              <div class="content">
                <div class="todo-title">${todoTitle}</div>
                <div class="due-date">📅 Due: ${formattedDate}</div>
                <p>This todo is due soon! Don't forget to complete it.</p>
              </div>
              <div class="footer">
                <p>Sent from your Todo App</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}