'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Navbar from '@/app/components/Navbar';  
import { Plus, Trash2, Edit2, Check, X, Calendar, Volume2, Sparkles, Bell, BellOff } from 'lucide-react';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  user_id: string;
  due_date: string | null;
};

// Notification Functions
function checkNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

function sendNotification(title: string, body: string) {
  if (!checkNotificationPermission()) return;
  try {
    new Notification(title, { body, icon: '/favicon.ico', requireInteraction: true });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

function checkUpcomingTodos(todos: Todo[]) {
  if (!checkNotificationPermission()) return;
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  todos.forEach(todo => {
    if (todo.completed || !todo.due_date) return;
    const dueDate = new Date(todo.due_date);
    if (dueDate > now && dueDate <= oneHourFromNow) {
      sendNotification('⏰ Task Due in 1 Hour!', todo.title);
    }
  });
}

function checkOverdueTodos(todos: Todo[]) {
  const now = new Date();
  const overdueTodos = todos.filter(todo => {
    if (todo.completed || !todo.due_date) return false;
    return new Date(todo.due_date) < now;
  });

  if (overdueTodos.length > 0) {
    sendNotification('🚨 Overdue Tasks!', `You have ${overdueTodos.length} overdue task(s)`);
  }
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadData();
    setNotificationsEnabled(checkNotificationPermission());
  }, []);

  // Check for upcoming todos every 5 minutes
  useEffect(() => {
    if (!notificationsEnabled || todos.length === 0) return;

    const interval = setInterval(() => {
      checkUpcomingTodos(todos);
      checkOverdueTodos(todos);
    }, 5 * 60 * 1000);

    checkUpcomingTodos(todos);
    checkOverdueTodos(todos);

    return () => clearInterval(interval);
  }, [todos, notificationsEnabled]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      alert('✅ Notifications enabled! You will receive reminders for upcoming tasks.');
    } else {
      alert('❌ Please enable notifications in browser settings.');
    }
  };

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, job_title')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setUserInfo({ name: profileData.full_name, job: profileData.job_title });
      }

      await loadTodos();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setTodos(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateAISuggestions = async () => {
    if (!userInfo) return alert('User profile not loaded');
    setIsGeneratingAI(true);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      if (!apiKey) throw new Error('Groq API key not found');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Return ONLY a JSON array of 5 todo task strings, no markdown.' },
            { role: 'user', content: `Generate 5 tasks for a ${userInfo.job}: ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"]` }
          ],
          temperature: 0.8,
          max_tokens: 500,
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const suggestions: string[] = JSON.parse(data.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim());
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      for (const suggestion of suggestions) {
        const { data: newTodo } = await supabase
          .from('todos')
          .insert([{ title: suggestion, completed: false, user_id: session.user.id, due_date: null }])
          .select()
          .single();

        if (newTodo) setTodos(prev => [newTodo, ...prev]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      alert('✅ AI suggestions added!');
    } catch (error: any) {
      alert(`❌ Failed: ${error.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const speakTodo = (id: string, text: string) => {
    try {
      window.speechSynthesis.cancel();
      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      setSpeakingId(id);
      utterance.onend = () => setSpeakingId(null);
      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    } catch (error) {
      setSpeakingId(null);
      alert('Text-to-speech not supported');
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setAdding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('todos')
        .insert([{ title: newTodo.trim(), completed: false, user_id: session.user.id, due_date: newDueDate || null }])
        .select()
        .single();

      if (data) {
        setTodos([data, ...todos]);
        setNewTodo('');
        setNewDueDate('');
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
  };

  const startEdit = (id: string, title: string, due_date: string | null) => {
    setEditingId(id);
    setEditingText(title);
    setEditingDueDate(due_date ? due_date.split('T')[0] : '');
  };

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    await supabase.from('todos').update({ title: editingText.trim(), due_date: editingDueDate || null }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, title: editingText.trim(), due_date: editingDueDate || null } : t));
    setEditingId(null);
  };

  const deleteTodo = async (id: string) => {
    if (!confirm('Delete this todo?')) return;
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
  };

  const isOverdue = (d: string | null) => d ? new Date(d) < new Date(new Date().setHours(0,0,0,0)) : false;
  const isToday = (d: string | null) => d ? new Date(d).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) : false;
  const isUpcoming = (d: string | null) => d ? new Date(d) > new Date(new Date().setHours(0,0,0,0)) : false;

  const formatDate = (d: string | null) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < -1) return `${Math.abs(diff)} days ago`;
    if (diff > 1) return `In ${diff} days`;
    return new Date(d).toLocaleDateString();
  };

  const getFilteredTodos = () => {
    if (filter === 'today') return todos.filter(t => isToday(t.due_date));
    if (filter === 'overdue') return todos.filter(t => isOverdue(t.due_date) && !t.completed);
    if (filter === 'upcoming') return todos.filter(t => isUpcoming(t.due_date));
    return todos;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();
  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    overdue: todos.filter(t => isOverdue(t.due_date) && !t.completed).length,
    today: todos.filter(t => isToday(t.due_date) && !t.completed).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Notification Button */}
        <div className="mb-6">
          <button
            onClick={handleEnableNotifications}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              notificationsEnabled
                ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border-2 border-white/20'
            }`}
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            {notificationsEnabled ? '🔔 Notifications Enabled' : '🔕 Enable Notifications'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-gray-300 text-sm">Total</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
            <p className="text-green-300 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
            <p className="text-red-300 text-sm">Overdue</p>
            <p className="text-3xl font-bold text-red-400">{stats.overdue}</p>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
            <p className="text-blue-300 text-sm">Today</p>
            <p className="text-3xl font-bold text-blue-400">{stats.today}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'today', 'overdue', 'upcoming'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                filter === f ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* AI Button */}
        <div className="mb-6">
          <button
            onClick={generateAISuggestions}
            disabled={isGeneratingAI}
            className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Sparkles className={`w-5 h-5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            {isGeneratingAI ? 'Generating...' : '✨ Generate AI Suggestions (Groq)'}
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={addTodo} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              disabled={adding}
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              disabled={adding}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={adding || !newTodo.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Todos List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <Check className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {filter === 'all' ? 'No todos yet!' : `No ${filter} todos.`}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white/10 backdrop-blur-sm border rounded-lg p-4 hover:bg-white/15 transition ${
                  isOverdue(todo.due_date) && !todo.completed ? 'border-red-500/50' :
                  isToday(todo.due_date) && !todo.completed ? 'border-blue-500/50' : 'border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition mt-1 ${
                      todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-400 hover:border-purple-400'
                    }`}
                  >
                    {todo.completed && <Check className="w-4 h-4 text-white" />}
                  </button>

                  <div className="flex-1">
                    {editingId === todo.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(todo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full px-3 py-2 bg-white/20 border border-purple-400 rounded-lg text-white focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="date"
                          value={editingDueDate}
                          onChange={(e) => setEditingDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white/20 border border-purple-400 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <span className={`block text-white ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                          {todo.title}
                        </span>
                        {todo.due_date && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${
                              isOverdue(todo.due_date) && !todo.completed ? 'text-red-400 font-semibold' :
                              isToday(todo.due_date) && !todo.completed ? 'text-blue-400 font-semibold' : 'text-gray-400'
                            }`}>
                              {formatDate(todo.due_date)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === todo.id ? (
                      <>
                        <button onClick={() => saveEdit(todo.id)} className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => speakTodo(todo.id, todo.title)}
                          className={`p-2 rounded-lg transition ${
                            speakingId === todo.id ? 'text-purple-400 bg-purple-500/20 animate-pulse' : 'text-purple-400 hover:bg-purple-500/20'
                          }`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => startEdit(todo.id, todo.title, todo.due_date)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteTodo(todo.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}