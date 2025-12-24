'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, Plus, Trash2, Calendar, CheckCircle, Circle, Filter } from 'lucide-react';
import NotificationManager from '../components/NotificationManager';
import Toast from '../components/Toast';
import { 
  checkUpcomingTodos, 
  scheduleDailyReminder, 
  startNotificationChecker,
  notifyTaskCompleted,
  notifyTaskAdded 
} from '../../lib/notifications';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  user_id: string;
  due_date: string | null;
};

type UserInfo = {
  email: string;
  id: string;
};

export default function TodosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (!loading && todos.length > 0 && userInfo) {
      // Start checking for upcoming tasks (1 hour before)
      const cleanup = startNotificationChecker(todos, userInfo.email);
      
      // Check for daily reminder
      scheduleDailyReminder(todos, userInfo.email);
      
      // Check on load
      checkUpcomingTodos(todos, userInfo.email);
      
      return cleanup;
    }
  }, [loading, todos, userInfo]);

  async function checkAuthAndLoadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/';
        return;
      }

      setUser(user);
      setUserInfo({
        email: user.email || '',
        id: user.id
      });

      const { data: todosData, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(todosData || []);
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setToast({ message: 'Logout failed', type: 'error' });
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          { 
            title: newTodo.trim(), 
            user_id: user.id,
            due_date: newDueDate || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodos([data, ...todos]);
        setNewTodo('');
        setNewDueDate('');
        
        // Show toast notification
        setToast({ message: 'Task added successfully!', type: 'success' });
        
        // Browser notification
        notifyTaskAdded(data.title);
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      setToast({ message: 'Failed to add task', type: 'error' });
    }
  }

  async function toggleTodo(id: string, completed: boolean) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
      
      // If marking as completed, show notification
      if (!completed) {
        const completedTodo = todos.find(t => t.id === id);
        if (completedTodo) {
          setToast({ message: 'Task completed! 🎉', type: 'success' });
          notifyTaskCompleted(completedTodo.title);
        }
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      setToast({ message: 'Failed to update task', type: 'error' });
    }
  }

  async function deleteTodo(id: string) {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.filter(todo => todo.id !== id));
      setToast({ message: 'Task deleted', type: 'info' });
    } catch (error) {
      console.error('Error deleting todo:', error);
      setToast({ message: 'Failed to delete task', type: 'error' });
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    dueToday: todos.filter(t => {
      if (!t.due_date || t.completed) return false;
      const due = new Date(t.due_date);
      const today = new Date();
      due.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    }).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <nav className="bg-gray-800/50 backdrop-blur-lg border-b border-purple-500/20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Todo App</h1>
            <p className="text-sm text-gray-400">{userInfo?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Notification Manager */}
        <NotificationManager />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-lg p-4 border border-blue-500/30">
            <p className="text-blue-300 text-sm">Active</p>
            <p className="text-3xl font-bold text-blue-100">{stats.active}</p>
          </div>
          <div className="bg-green-500/20 backdrop-blur-lg rounded-lg p-4 border border-green-500/30">
            <p className="text-green-300 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-100">{stats.completed}</p>
          </div>
          <div className="bg-purple-500/20 backdrop-blur-lg rounded-lg p-4 border border-purple-500/30">
            <p className="text-purple-300 text-sm">Due Today</p>
            <p className="text-3xl font-bold text-purple-100">{stats.dueToday}</p>
          </div>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </form>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Filter className="w-4 h-4" />
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'active'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>

        {/* Todos List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-12 text-center border border-white/20">
              <p className="text-gray-400 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-2">Add a new task to get started!</p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const dueDate = todo.due_date ? new Date(todo.due_date) : null;
              const now = new Date();
              const isOverdue = dueDate && dueDate < now && !todo.completed;
              const isDueToday = dueDate && 
                dueDate.toDateString() === now.toDateString() && 
                !todo.completed;

              return (
                <div
                  key={todo.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-lg p-4 border transition ${
                    todo.completed
                      ? 'border-green-500/30 bg-green-500/10'
                      : isOverdue
                      ? 'border-red-500/50 bg-red-500/10'
                      : isDueToday
                      ? 'border-yellow-500/50 bg-yellow-500/10'
                      : 'border-white/20 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className="mt-1 text-gray-400 hover:text-purple-400 transition"
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`text-lg ${
                        todo.completed
                          ? 'text-gray-400 line-through'
                          : 'text-white'
                      }`}>
                        {todo.title}
                      </p>
                      
                      {dueDate && (
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${
                            isOverdue
                              ? 'text-red-400 font-semibold'
                              : isDueToday
                              ? 'text-yellow-400 font-semibold'
                              : 'text-gray-400'
                          }`}>
                            {isOverdue && '⚠️ Overdue: '}
                            {isDueToday && '📅 Today: '}
                            {dueDate.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}