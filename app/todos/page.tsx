'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, Plus, Trash2, Calendar, CheckCircle, Circle, Edit2, X, Check, Volume2, Globe } from 'lucide-react';
import { requestNotificationPermission, startNotificationChecker } from '../../lib/notifications';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  user_id: string;
  created_at: string;
}

interface Profile {
  full_name: string;
  job_title: string;
  avatar_url?: string;
}
const COMMON_TAGS = [
  { label: 'Work', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { label: 'Personal', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { label: 'Important', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { label: 'Shopping', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { label: 'Health', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { label: 'Learning', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { label: 'Meeting', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
];

export default function TodosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showTranslateMenu, setShowTranslateMenu] = useState<string | null>(null);
  
  // Tags states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagMenu, setShowTagMenu] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  useEffect(() => {
    checkUser();
    fetchTodos();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (user && todos.length > 0) {
      const cleanup = startNotificationChecker(todos, user.email || '');
      return cleanup;
    }
  }, [todos, user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/signin';
      return;
    }
    setUser(user);
    fetchProfile(user.id);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, job_title, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.avatar_url) {
          setProfile({
            full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
            job_title: 'User',
            avatar_url: user.user_metadata.avatar_url
          });
        }
      }
    } catch (error) {
      console.log('Profile not found, using defaults');
    }
  };

  const fetchTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string, todoId: string) => {
    if (speakingId === todoId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setSpeakingId(todoId);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data[0][0][0];
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const translateTodo = async (todoId: string, targetLang: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    setTranslatingId(todoId);
    setShowTranslateMenu(null);

    try {
      const translated = await translateText(todo.title, targetLang);
      
      const { error } = await supabase
        .from('todos')
        .update({ title: translated })
        .eq('id', todoId);

      if (!error) {
        setTodos(todos.map(t => t.id === todoId ? { ...t, title: translated } : t));
      }
    } catch (error) {
      console.error('Error translating:', error);
    } finally {
      setTranslatingId(null);
    }
  };

  const addTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTodo.trim() || !user) return;

    try {
      const todoData = {
        title: newTodo.trim(),
        completed: false,
        user_id: user.id,
        due_date: dueDate || null
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        setTodos([data, ...todos]);
        setNewTodo('');
        setDueDate('');
        
        setTimeout(() => speakText(data.title, data.id), 300);
      }
    } catch (error: any) {
      console.error('Error adding todo:', error);
      alert('Failed to add task: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (!error) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.title);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editText })
        .eq('id', id);

      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, title: editText } : t));
        setEditingId(null);
        setEditText('');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  };

  const getFilteredTodos = () => {
    if (filter === 'active') return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t => t.completed);
    return todos;
  };

  const getDueStatus = (dueDate: string | null) => {
    if (!dueDate) return { status: 'upcoming', color: 'text-purple-400', icon: '📆', label: 'Upcoming' };
    
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 0) return { status: 'overdue', color: 'text-red-400', icon: '⚠️', label: 'Overdue' };
    if (hours < 24) return { status: 'today', color: 'text-orange-400', icon: '📅', label: 'Today' };
    return { status: 'upcoming', color: 'text-purple-400', icon: '📆', label: 'Upcoming' };
  };

  const filteredTodos = getFilteredTodos();
  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    dueToday: todos.filter(t => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      const today = new Date();
      return due.toDateString() === today.toDateString() && !t.completed;
    }).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 sm:gap-8">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Todo App
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/10">
                  {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                    <img 
                      src={profile?.avatar_url || user.user_metadata?.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-400"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-purple-400 ${profile?.avatar_url || user.user_metadata?.avatar_url ? 'hidden' : ''}`}>
                    {profile?.full_name?.[0]?.toUpperCase() || user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white text-sm font-medium">
                      {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-purple-300 text-xs">{profile?.job_title || 'User'}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 transition backdrop-blur-lg border border-red-500/20"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, color: 'from-purple-600 to-purple-800', icon: '📋' },
            { label: 'Active', value: stats.active, color: 'from-blue-600 to-blue-800', icon: '⚡' },
            { label: 'Completed', value: stats.completed, color: 'from-green-600 to-green-800', icon: '✅' },
            { label: 'Due Today', value: stats.dueToday, color: 'from-orange-600 to-orange-800', icon: '🔔' }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-lg border border-white/10 shadow-xl hover:scale-105 transition-transform`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-white/80 text-xs sm:text-sm font-medium">{stat.label}</p>
                <span className="text-xl sm:text-2xl">{stat.icon}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={addTodo} className="bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />

            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
            />

            <button
              type="submit"
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Task</span>
            </button>
          </div>
        </form>

        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'completed', label: 'Completed', count: stats.completed }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 sm:px-6 py-2 rounded-xl font-medium transition whitespace-nowrap text-sm ${
                filter === f.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const dueStatus = getDueStatus(todo.due_date);
            const isEditing = editingId === todo.id;
            const isSpeaking = speakingId === todo.id;
            const isTranslating = translatingId === todo.id;
            const showMenu = showTranslateMenu === todo.id;

            return (
              <div
                key={todo.id}
                className={`bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 border transition-all hover:scale-[1.01] shadow-xl ${
                  todo.completed
                    ? 'border-green-500/30 opacity-75'
                    : dueStatus.status === 'overdue'
                    ? 'border-red-500/30'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className="flex-shrink-0 mt-1 sm:mt-0"
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-white/40 hover:text-purple-400 transition" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div>
                        <p className={`text-white font-medium break-words ${todo.completed ? 'line-through opacity-60' : ''}`}>
                          {todo.title}
                        </p>
                        {todo.due_date && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Calendar className={`w-3 h-3 ${dueStatus.color}`} />
                            <span className={`text-xs ${dueStatus.color}`}>
                              {dueStatus.icon} {new Date(todo.due_date).toLocaleString('en-US')}
                            </span>
                            {dueStatus.status === 'overdue' && (
                              <span className="text-xs bg-red-600/20 px-2 py-0.5 rounded text-red-400">
                                {dueStatus.label}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 transition"
                          title="Save"
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 transition"
                          title="Cancel"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(todo)}
                          className="p-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5 text-yellow-400" />
                        </button>
                        
                        <button
                          onClick={() => speakText(todo.title, todo.id)}
                          className={`p-2 rounded-lg transition ${
                            isSpeaking 
                              ? 'bg-purple-600/40 animate-pulse' 
                              : 'bg-purple-600/20 hover:bg-purple-600/30'
                          }`}
                          title="Read aloud"
                        >
                          <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-purple-300' : 'text-purple-400'}`} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setShowTranslateMenu(showMenu ? null : todo.id)}
                            disabled={isTranslating}
                            className={`p-2 rounded-lg transition ${
                              isTranslating
                                ? 'bg-blue-600/40 cursor-wait'
                                : 'bg-blue-600/20 hover:bg-blue-600/30'
                            }`}
                            title="Translate"
                          >
                            <Globe className={`w-5 h-5 text-blue-400 ${isTranslating ? 'animate-spin' : ''}`} />
                          </button>

                          {showMenu && (
                            <>
                              <div 
                                className="fixed inset-0 z-[60]" 
                                onClick={() => setShowTranslateMenu(null)}
                              />
                              <div className="absolute right-0 bottom-full mb-2 bg-black/95 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl z-[70] min-w-[140px]">
                                {[
                                  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
                                  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
                                  { code: 'en', name: 'English', flag: '🇺🇸' },
                                  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                                  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
                                  { code: 'fr', name: 'French', flag: '🇫🇷' }
                                ].map((lang) => (
                                  <button
                                    key={lang.code}
                                    onClick={() => translateTodo(todo.id, lang.code)}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition text-left text-sm first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span className="text-white">{lang.name}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTodos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-white/60 text-lg">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}