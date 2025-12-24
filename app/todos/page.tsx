'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { requestNotificationPermission, checkUpcomingTodos } from '@/lib/notifications';

type Todo = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  user_id: string;
};

type FilterType = 'all' | 'today' | 'overdue' | 'upcoming';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const supabase = createClient();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
      
      // Check notifications every 5 minutes
      const interval = setInterval(() => {
        if (notificationEnabled && user.email) {
          checkUpcomingTodos(todos, user.email);
        }
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user, notificationEnabled, todos]);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodos() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        setTodos(data || []);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo,
            user_id: user.id,
            due_date: dueDate || null,
            completed: false,
          },
        ]);

      if (error) {
        console.error('Error adding todo:', error);
      } else {
        setNewTodo('');
        setDueDate('');
        await fetchTodos();
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }

  async function toggleTodo(id: string, completed: boolean) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) {
        console.error('Error updating todo:', error);
      } else {
        await fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting todo:', error);
      } else {
        await fetchTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }

  async function updateTodo(id: string) {
    if (!editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editTitle })
        .eq('id', id);

      if (error) {
        console.error('Error updating todo:', error);
      } else {
        setEditingId(null);
        setEditTitle('');
        await fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    
    if (granted && user?.email) {
      checkUpcomingTodos(todos, user.email);
    }
  }

  function getTimeLabel(dueDate: string | null) {
    if (!dueDate) return 'No date';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return `In ${Math.floor(diffDays / 7)} weeks`;
  }

  function getFilteredTodos() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        return todos.filter(todo => {
          if (!todo.due_date) return false;
          const due = new Date(todo.due_date);
          due.setHours(0, 0, 0, 0);
          return due.getTime() === now.getTime();
        });
      case 'overdue':
        return todos.filter(todo => {
          if (!todo.due_date || todo.completed) return false;
          const due = new Date(todo.due_date);
          due.setHours(0, 0, 0, 0);
          return due < now;
        });
      case 'upcoming':
        return todos.filter(todo => {
          if (!todo.due_date || todo.completed) return false;
          const due = new Date(todo.due_date);
          due.setHours(0, 0, 0, 0);
          return due > now;
        });
      default:
        return todos;
    }
  }

  const filteredTodos = getFilteredTodos();
  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueTodos = todos.filter(t => {
    if (!t.due_date || t.completed) return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    return due < now;
  }).length;
  const todayTodos = todos.filter(t => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === now.getTime();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
          <p className="text-white mb-4">Please log in to view your todos</p>
          <a href="/login" className="block text-center bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Todo App</h1>
          </div>
          <div className="flex items-center gap-4">
            {!notificationEnabled ? (
              <button
                onClick={enableNotifications}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/50 transition"
              >
                🔔 Enable Notifications
              </button>
            ) : (
              <div className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/50">
                ✅ Notifications On
              </div>
            )}
            <div className="flex items-center gap-3 text-white">
              <span className="text-sm">{user.email}</span>
              <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Total</div>
            <div className="text-4xl font-bold text-white">{totalTodos}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Completed</div>
            <div className="text-4xl font-bold text-green-400">{completedTodos}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Overdue</div>
            <div className="text-4xl font-bold text-red-400">{overdueTodos}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-300 text-sm mb-1">Today</div>
            <div className="text-4xl font-bold text-purple-400">{todayTodos}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'all' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'today' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'overdue' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'upcoming' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition"
          >
            + Add
          </button>
        </form>

        {/* Todos List */}
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 flex items-center justify-between group hover:bg-white/15 transition"
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-5 h-5 rounded border-2 border-purple-400 text-purple-500 focus:ring-purple-500 cursor-pointer"
                />
                {editingId === todo.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => updateTodo(todo.id)}
                    onKeyDown={(e) => e.key === 'Enter' && updateTodo(todo.id)}
                    className="flex-1 px-3 py-1 bg-white/20 rounded-lg text-white border border-white/30 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div className="flex-1">
                    <p className={`text-lg ${todo.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {todo.title}
                    </p>
                    {todo.due_date && (
                      <p className="text-sm text-gray-400 mt-1">
                        📅 {getTimeLabel(todo.due_date)}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingId(todo.id);
                    setEditTitle(todo.title);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-yellow-400"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-red-400"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTodos.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">No todos found for this filter</p>
            <p className="text-sm mt-2">Add a new todo to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}