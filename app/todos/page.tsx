'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, Plus, Trash2, Calendar, CheckCircle, Circle, Edit2, X, Check, Globe, Tag } from 'lucide-react';
import { requestNotificationPermission, startNotificationChecker } from '../../lib/notifications';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  user_id: string;
  created_at: string;
  tags?: string[];
}

interface Profile {
  full_name: string;
  job_title: string;
  avatar_url?: string;
}

const PRESET_TAGS = [
  { name: 'Work', color: 'bg-blue-500' },
  { name: 'Personal', color: 'bg-green-500' },
  { name: 'Urgent', color: 'bg-red-500' },
  { name: 'Important', color: 'bg-yellow-500' },
  { name: 'Meeting', color: 'bg-purple-500' },
  { name: 'Project', color: 'bg-pink-500' },
  { name: 'Ideas', color: 'bg-indigo-500' },
  { name: 'Shopping', color: 'bg-orange-500' },
];

export default function TodosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTagMenu, setShowTagMenu] = useState(false);

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
      const { data } = await supabase
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
      console.log('Profile not found');
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

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
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
        due_date: dueDate || null,
        tags: selectedTags
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (!error && data) {
        setTodos([data, ...todos]);
        setNewTodo('');
        setDueDate('');
        setSelectedTags([]);
      }
    } catch (error: any) {
      console.error('Error adding todo:', error);
      alert('Failed to add task');
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
    setEditTags(todo.tags || []);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editText, tags: editTags })
        .eq('id', id);

      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, title: editText, tags: editTags } : t));
        setEditingId(null);
        setEditText('');
        setEditTags([]);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditTags([]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  };

  const translateText = async (text: string) => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data[0][0][0];
    } catch {
      return text + ' [EN]';
    }
  };

  const translateTodo = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const translated = await translateText(todo.title);
    
    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: translated })
        .eq('id', todoId);

      if (!error) {
        setTodos(todos.map(t => t.id === todoId ? { ...t, title: translated } : t));
      }
    } catch (error) {
      console.error('Error translating:', error);
    }
  };

  const getFilteredTodos = () => {
    let filtered = todos;
    
    if (filter === 'active') filtered = filtered.filter(t => !t.completed);
    if (filter === 'completed') filtered = filtered.filter(t => t.completed);
    
    if (tagFilter) {
      filtered = filtered.filter(t => t.tags?.includes(tagFilter));
    }
    
    return filtered;
  };

  const getDueStatus = (dueDate: string | null) => {
    if (!dueDate) return { status: 'upcoming', color: 'text-purple-400', icon: '📆' };
    
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 0) return { status: 'overdue', color: 'text-red-400', icon: '⚠️' };
    if (hours < 24) return { status: 'today', color: 'text-orange-400', icon: '📅' };
    return { status: 'upcoming', color: 'text-purple-400', icon: '📆' };
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    todos.forEach(todo => {
      todo.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  const getTagColor = (tag: string) => {
    const preset = PRESET_TAGS.find(p => p.name === tag);
    return preset?.color || 'bg-gray-500';
  };

  const filteredTodos = getFilteredTodos();
  const allTags = getAllTags();
  
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
      {/* Navbar */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Todo App
            </h1>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/10">
                  {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                    <img 
                      src={profile?.avatar_url || user.user_metadata?.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-purple-400">
                      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-white text-sm font-medium">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-purple-300 text-xs">{profile?.job_title || 'User'}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'from-purple-600 to-purple-800', icon: '📋' },
            { label: 'Active', value: stats.active, color: 'from-blue-600 to-blue-800', icon: '⚡' },
            { label: 'Completed', value: stats.completed, color: 'from-green-600 to-green-800', icon: '✅' },
            { label: 'Due Today', value: stats.dueToday, color: 'from-orange-600 to-orange-800', icon: '🔔' }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 sm:p-6 border border-white/10 shadow-xl hover:scale-105 transition-transform`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-white/80 text-xs sm:text-sm font-medium">{stat.label}</p>
                <span className="text-xl sm:text-2xl">{stat.icon}</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Add Task Form */}
        <div className="bg-black/30 backdrop-blur-xl rounded-xl p-4 sm:p-6 mb-4 border border-white/10 shadow-2xl">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Tag Selection */}
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    selectedTags.includes(tag.name)
                      ? `${tag.color} text-white`
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => addTodo()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'completed', label: 'Completed', count: stats.completed }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => {setFilter(f.key as any); setTagFilter(null);}}
              className={`px-4 py-2 rounded-xl font-medium transition whitespace-nowrap text-sm ${
                filter === f.key && !tagFilter
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}

          {allTags.length > 0 && (
            <>
              <div className="border-l border-white/20 mx-2"></div>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {setTagFilter(tagFilter === tag ? null : tag); setFilter('all');}}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    tagFilter === tag
                      ? `${getTagColor(tag)} text-white`
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  🏷️ {tag}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const dueStatus = getDueStatus(todo.due_date);
            const isEditing = editingId === todo.id;

            return (
              <div
                key={todo.id}
                className={`bg-black/30 backdrop-blur-xl rounded-xl p-4 border transition-all hover:scale-[1.01] shadow-xl ${
                  todo.completed ? 'border-green-500/30 opacity-75' : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mt-1">
                    {todo.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-white/40 hover:text-purple-400 transition" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-2">
                          {PRESET_TAGS.map((tag) => (
                            <button
                              key={tag.name}
                              onClick={() => {
                                if (editTags.includes(tag.name)) {
                                  setEditTags(editTags.filter(t => t !== tag.name));
                                } else {
                                  setEditTags([...editTags, tag.name]);
                                }
                              }}
                              className={`px-2 py-1 rounded text-xs font-medium transition ${
                                editTags.includes(tag.name)
                                  ? `${tag.color} text-white`
                                  : 'bg-white/10 text-white/60'
                              }`}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className={`text-white font-medium break-words ${todo.completed ? 'line-through opacity-60' : ''}`}>
                          {todo.title}
                        </p>
                        
                        {/* Tags */}
                        {todo.tags && todo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {todo.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`${getTagColor(tag)} text-white text-xs px-2 py-0.5 rounded`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {todo.due_date && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className={`w-3 h-3 ${dueStatus.color}`} />
                            <span className={`text-xs ${dueStatus.color}`}>
                              {dueStatus.icon} {new Date(todo.due_date).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 transition"
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 transition"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(todo)}
                          className="p-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 transition"
                        >
                          <Edit2 className="w-5 h-5 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => translateTodo(todo.id)}
                          className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition"
                        >
                          <Globe className="w-5 h-5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 transition"
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