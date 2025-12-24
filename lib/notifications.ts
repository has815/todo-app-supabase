type Todo = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
};

export function checkNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function sendNotification(title: string, body: string) {
  if (!checkNotificationPermission()) {
    console.log('Notification permission not granted');
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'todo-reminder',
      requireInteraction: true,
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

export async function sendEmailReminder(userEmail: string, todoTitle: string, dueDate: string) {
  try {
    const response = await fetch('/api/send-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        todoTitle,
        dueDate,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email reminder');
    }
  } catch (error) {
    console.error('Email reminder error:', error);
  }
}

export function checkUpcomingTodos(todos: Todo[], userEmail: string) {
  if (!checkNotificationPermission()) return;

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  todos.forEach(todo => {
    if (todo.completed || !todo.due_date) return;

    const dueDate = new Date(todo.due_date);
    
    // Check if todo is due within the next hour
    if (dueDate > now && dueDate <= oneHourFromNow) {
      const minutesUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));
      
      // Send browser notification
      sendNotification(
        '⏰ Todo Reminder',
        `"${todo.title}" is due in ${minutesUntilDue} minutes!`
      );

      // Send email reminder
      sendEmailReminder(userEmail, todo.title, todo.due_date);
    }
  });
}