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

export function sendNotification(title: string, body: string, icon?: string) {
  if (!checkNotificationPermission()) {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true, // Stay until user dismisses
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

export function checkUpcomingTodos(todos: Todo[], userEmail: string) {
  if (!checkNotificationPermission()) return;

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

  // Find todos due in next 1 hour
  const upcomingTodos = todos.filter(todo => {
    if (todo.completed || !todo.due_date) return false;
    
    const dueDate = new Date(todo.due_date);
    
    // Check if due date is within next 1 hour
    return dueDate > now && dueDate <= oneHourFromNow;
  });

  if (upcomingTodos.length > 0) {
    upcomingTodos.forEach(todo => {
      // Browser notification
      sendNotification(
        '⏰ Task Due in 1 Hour!',
        `${todo.title}`
      );

      // Send email reminder
      sendEmailReminder(userEmail, todo);
    });
  }
}

async function sendEmailReminder(userEmail: string, todo: Todo) {
  try {
    await fetch('/api/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        todoTitle: todo.title,
        dueDate: todo.due_date,
      }),
    });
  } catch (error) {
    console.error('Email reminder error:', error);
  }
}

export function checkDueTodos(todos: Todo[], userEmail: string) {
  if (!checkNotificationPermission()) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check for overdue todos
  const overdueTodos = todos.filter(todo => {
    if (todo.completed || !todo.due_date) return false;
    const dueDate = new Date(todo.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  if (overdueTodos.length > 0) {
    sendNotification(
      `⚠️ ${overdueTodos.length} Overdue Task${overdueTodos.length > 1 ? 's' : ''}`,
      overdueTodos.slice(0, 3).map(t => `• ${t.title}`).join('\n')
    );
  }

  // Check for today's todos
  const todayTodos = todos.filter(todo => {
    if (todo.completed || !todo.due_date) return false;
    const dueDate = new Date(todo.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  if (todayTodos.length > 0) {
    sendNotification(
      `📅 ${todayTodos.length} Task${todayTodos.length > 1 ? 's' : ''} Due Today`,
      todayTodos.slice(0, 3).map(t => `• ${t.title}`).join('\n')
    );
  }
}

export function scheduleDailyReminder(todos: Todo[], userEmail: string) {
  if (!checkNotificationPermission()) return;

  const now = new Date();
  const lastCheck = localStorage.getItem('lastNotificationCheck');
  const today = now.toDateString();

  // Check at 9 AM
  if (lastCheck !== today && now.getHours() >= 9) {
    checkDueTodos(todos, userEmail);
    localStorage.setItem('lastNotificationCheck', today);
  }
}

export function startNotificationChecker(todos: Todo[], userEmail: string) {
  // Check every 5 minutes for upcoming tasks (1 hour before)
  const interval = setInterval(() => {
    checkUpcomingTodos(todos, userEmail);
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
}

export function notifyTaskCompleted(title: string) {
  if (!checkNotificationPermission()) return;
  
  sendNotification(
    '✅ Task Completed!',
    title
  );
}

export function notifyTaskAdded(title: string) {
  if (!checkNotificationPermission()) return;
  
  sendNotification(
    '➕ New Task Added',
    title
  );
}