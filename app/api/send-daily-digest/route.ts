import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, todos } = await request.json();

    if (!email || !todos) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const todayTasks = todos.filter((t: any) => {
      if (t.completed || !t.due_date) return false;
      const due = new Date(t.due_date);
      const now = new Date();
      due.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return due.getTime() === now.getTime();
    });

    const overdueTasks = todos.filter((t: any) => {
      if (t.completed || !t.due_date) return false;
      const due = new Date(t.due_date);
      const now = new Date();
      due.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return due < now;
    });

    const upcomingTasks = todos.filter((t: any) => {
      if (t.completed || !t.due_date) return false;
      const due = new Date(t.due_date);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      due.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      return due.getTime() === tomorrow.getTime();
    });

    const taskListHTML = (tasks: any[], emoji: string) => 
      tasks.length > 0
        ? tasks.map(t => `<li style="margin-bottom: 10px; color: #333; font-size: 14px;">${emoji} ${t.title}</li>`).join('')
        : `<li style="color: #999; font-style: italic;">No tasks</li>`;

    const { data, error } = await resend.emails.send({
      from: 'Todo App <onboarding@resend.dev>',
      to: [email],
      subject: `📅 Daily Digest - ${today}`,
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
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">📅 Daily Digest</h1>
                        <p style="margin: 10px 0 0 0; color: #e8e8ff; font-size: 16px;">${today}</p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px;">
                        ${overdueTasks.length > 0 ? `
                        <div style="background-color: #fee; border-left: 4px solid #f44336; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                          <h2 style="margin: 0 0 15px 0; color: #c62828; font-size: 20px;">⚠️ Overdue (${overdueTasks.length})</h2>
                          <ul style="margin: 0; padding-left: 20px;">
                            ${taskListHTML(overdueTasks.slice(0, 5), '🔴')}
                          </ul>
                        </div>
                        ` : ''}
                        
                        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                          <h2 style="margin: 0 0 15px 0; color: #1565c0; font-size: 20px;">📅 Today (${todayTasks.length})</h2>
                          <ul style="margin: 0; padding-left: 20px;">
                            ${taskListHTML(todayTasks.slice(0, 5), '🔵')}
                          </ul>
                        </div>
                        
                        ${upcomingTasks.length > 0 ? `
                        <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                          <h2 style="margin: 0 0 15px 0; color: #e65100; font-size: 20px;">🔔 Tomorrow (${upcomingTasks.length})</h2>
                          <ul style="margin: 0; padding-left: 20px;">
                            ${taskListHTML(upcomingTasks.slice(0, 5), '🟡')}
                          </ul>
                        </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin-top: 30px;">
                          <a href="https://todo-app-supabase-lac.vercel.app/todos" 
                             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            View All Tasks →
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                          Have a productive day! 🚀
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
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}