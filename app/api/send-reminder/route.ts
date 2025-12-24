import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, todoTitle, dueDate } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Todo App <onboarding@resend.dev>',
      to: [email],
      subject: '⏰ Task Reminder - Due in 1 Hour',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">⏰ Task Reminder</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0;">${todoTitle}</h3>
            <p style="color: #666; margin: 10px 0 0 0;">Due: ${new Date(dueDate).toLocaleString()}</p>
          </div>
          <p>This task is due in approximately 1 hour!</p>
          <a href="https://todo-app-supabase-lac.vercel.app/todos" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Task</a>
        </div>
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