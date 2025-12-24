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
  if (!('Notification' in window)) {
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

export function sendNotification(title: string, body: string) {
  if (!checkNotificationPermission()) return;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

export function checkUpcomingTodos(todos: Todo[], userEmail: string) {
  if (!checkNotificationPermission()) return;

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const upcomingTodos = todos.filter(todo => {
    if (todo.completed || !todo.due_date) return false;
    
    const dueDate = new Date(todo.due_date);
    return dueDate > now && dueDate <= oneHourFromNow;
  });

  if (upcomingTodos.length > 0) {
    upcomingTodos.forEach(todo => {
      sendNotification('⏰ Task Due in 1 Hour!', todo.title);
      
      // Send email
      fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          todoTitle: todo.title,
          dueDate: todo.due_date,
        }),
      }).catch(console.error);
    });
  }
}

export function checkOverdueTodos(todos: Todo[], userEmail: string) {
  const now = new Date();
  
  const overdueTodos = todos.filter(todo => {
    if (todo.completed || !todo.due_date) return false;
    
    const dueDate = new Date(todo.due_date);
    return dueDate < now;
  });

  if (overdueTodos.length > 0) {
    sendNotification(
      '🚨 Overdue Tasks!',
      `You have ${overdueTodos.length} overdue task(s)`
    );
  }
}