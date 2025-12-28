'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { LogOut, Plus, Trash2, Calendar, CheckCircle, Circle, Edit2, X, Check, Volume2, Globe, Image as ImageIcon, XCircle, Shield } from 'lucide-react';
import { requestNotificationPermission, startNotificationChecker } from '../../lib/notifications';

interface Todo {
  id: string;
  title: string;
  original_title?: string | null;
  completed: boolean;
  due_date: string | null;
  user_id: string;
  created_at: string;
  tags: string[];
  image_url?: string | null;
}

interface Profile {
  full_name: string;
  job_title: string;
  avatar_url?: string;
}
const ADMIN_EMAILS = [
  'hassanahmed12168@gmail.com',
  // Add more admin emails
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', voice: 'en-US' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', voice: 'ur-PK' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', voice: 'hi-IN' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', voice: 'es-ES' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', voice: 'ja-JP' },
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);

  const predefinedTags = [
    { name: 'Work', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { name: 'Personal', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { name: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { name: 'Important', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { name: 'Shopping', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { name: 'Health', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  ];

  // Function to check if user is logged in
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/signin';
      return;
    }
    setUser(user);
    setIsUserAdmin(ADMIN_EMAILS.includes(user.email || ''));
  };

  // Function to check if user is admin
  const checkIfAdmin = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      setIsUserAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Admin check error:', error);
      setIsUserAdmin(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      await checkUser();
      await fetchTodos();
      requestNotificationPermission();
    };

    initialize();
  }, []);

  // Re-check admin when user changes
  useEffect(() => {
    if (user) {
      checkIfAdmin(user.id);
    }
  }, [user]);

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
      let translated = todo.title;

      if (targetLang === 'en' && todo.original_title) {
        translated = todo.original_title;
      } else {
        translated = await translateText(todo.title, targetLang);

        if (!todo.original_title && targetLang !== 'en') {
          await supabase
            .from('todos')
            .update({ original_title: todo.title })
            .eq('id', todoId);
        }
      }

      const { error } = await supabase
        .from('todos')
        .update({ title: translated })
        .eq('id', todoId);

      if (!error) {
        setTodos(prevTodos =>
          prevTodos.map(t =>
            t.id === todoId
              ? {
                ...t,
                title: translated,
                original_title: t.original_title || (targetLang !== 'en' ? todo.title : t.original_title),
              }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Error translating:', error);
    } finally {
      setTranslatingId(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const addTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTodo.trim() || !user) return;

    let imageUrl = null;

    try {
      setUploadingImage(true);

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('task-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('task-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const todoData = {
        title: newTodo.trim(),
        completed: false,
        user_id: user.id,
        due_date: dueDate || null,
        tags: selectedTags,
        original_title: null,
        image_url: imageUrl,
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodos([data, ...todos]);
        setNewTodo('');
        setDueDate('');
        setSelectedTags([]);
        setSelectedImage(null);
        setImagePreview(null);
        setTimeout(() => speakText(data.title, data.id), 300);
      }
    } catch (error: any) {
      console.error('Error adding todo:', error);
      alert('Failed to add task: ' + (error.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
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
    let filtered = todos;
    if (filter === 'active') filtered = filtered.filter(t => !t.completed);
    if (filter === 'completed') filtered = filtered.filter(t => t.completed);
    if (tagFilter) filtered = filtered.filter(t => t.tags && t.tags.includes(tagFilter));
    return filtered;
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

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Todo App
            </h1>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/10 flex-1 sm:flex-none min-w-0">
                  {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                    <img
                      src={profile?.avatar_url || user.user_metadata?.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-400 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-purple-400 flex-shrink-0 ${profile?.avatar_url || user.user_metadata?.avatar_url ? 'hidden' : ''}`}>
                    {profile?.full_name?.[0]?.toUpperCase() || user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-purple-300 text-xs truncate">{profile?.job_title || 'User'}</p>
                  </div>
                </div>
              )}

              {isUserAdmin && (
                <Link href="/admin" className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 transition flex items-center gap-2 text-yellow-400 border border-yellow-500/20 backdrop-blur-lg shadow-lg flex-shrink-0">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Admin</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 transition backdrop-blur-lg border border-red-500/20 flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, color: 'from-purple-600 to-purple-800', icon: '📋' },
            { label: 'Active', value: stats.active, color: 'from-blue-600 to-blue-800', icon: '⚡' },
            { label: 'Completed', value: stats.completed, color: 'from-green-600 to-green-800', icon: '✅' },
            { label: 'Due Today', value: stats.dueToday, color: 'from-orange-600 to-orange-800', icon: '🔔' }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 sm:p-6 backdrop-blur-lg border border-white/10 shadow-xl hover:scale-105 transition-transform text-center`}>
              <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-4xl font-bold text-white">{stat.value}</p>
              <span className="text-xl sm:text-2xl mt-1 block">{stat.icon}</span>
            </div>
          ))}
        </div>

        <form onSubmit={addTodo} className="bg-black/30 backdrop-blur-xl rounded-2xl p-5 sm:p-6 mb-8 border border-white/10 shadow-2xl">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-base"
              />
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full sm:w-52 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-base"
              />
              <button
                type="submit"
                disabled={uploadingImage}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 text-base"
              >
                <Plus className="w-5 h-5" />
                {uploadingImage ? 'Uploading...' : 'Add Task'}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-white/80 text-sm font-medium">Attach Image (optional)</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-5 py-3 bg-white/10 border border-white/20 rounded-xl cursor-pointer hover:bg-white/20 transition flex items-center gap-2 text-sm">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-3 bg-red-600/20 hover:bg-red-600/30 rounded-xl transition"
                    title="Remove image"
                  >
                    <XCircle className="w-5 h-5 text-red-400" />
                  </button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-cover rounded-xl border border-white/20 shadow-lg sm:w-64 sm:max-h-64"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500">
              {predefinedTags.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition flex-shrink-0 ${selectedTags.includes(tag.name)
                    ? tag.color
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                    }`}
                >
                  🏷️ {tag.name}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'completed', label: 'Completed', count: stats.completed }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-6 py-2 rounded-xl font-medium transition whitespace-nowrap flex-shrink-0 ${filter === f.key
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredTodos.map((todo) => {
            const dueStatus = getDueStatus(todo.due_date);
            const isEditing = editingId === todo.id;
            const isSpeaking = speakingId === todo.id;
            const isTranslating = translatingId === todo.id;
            const showMenu = showTranslateMenu === todo.id;

            return (
              <div
                key={todo.id}
                className={`bg-black/30 backdrop-blur-xl rounded-xl p-4 border transition-all hover:scale-[1.01] shadow-xl ${todo.completed
                  ? 'border-green-500/30 opacity-80'
                  : dueStatus.status === 'overdue'
                    ? 'border-red-500/30'
                    : 'border-white/10'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className="flex-shrink-0 mt-1"
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    ) : (
                      <Circle className="w-7 h-7 text-white/50 hover:text-purple-400 transition" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <p className={`text-lg font-medium break-words ${todo.completed ? 'line-through opacity-70' : 'text-white'}`}>
                          {todo.title}
                        </p>

                        {todo.image_url && (
                          <div
                            className="mt-3 cursor-pointer inline-block"
                            onClick={() => setFullImageView(todo.image_url)}
                          >
                            <img
                              src={todo.image_url}
                              alt="Task attachment"
                              className="w-16 h-16 rounded-full object-cover border-2 border-purple-400/60 shadow-md hover:scale-110 transition-transform duration-200"
                              title="Tap to view full image"
                            />
                          </div>
                        )}

                        {todo.tags && todo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {todo.tags.map((tagName) => {
                              const tagConfig = predefinedTags.find(t => t.name === tagName);
                              return (
                                <span
                                  key={tagName}
                                  className={`text-xs px-2 py-0.5 rounded border ${tagConfig?.color || 'bg-white/10 text-white/60 border-white/20'}`}
                                >
                                  🏷️ {tagName}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {todo.due_date && (
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Calendar className={`w-4 h-4 ${dueStatus.color}`} />
                            <span className={`text-xs ${dueStatus.color}`}>
                              {dueStatus.icon} {new Date(todo.due_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            {dueStatus.status === 'overdue' && (
                              <span className="text-xs bg-red-600/30 px-2 py-0.5 rounded text-red-300">
                                {dueStatus.label}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(todo.id)} className="p-2.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 transition">
                          <Check className="w-5 h-5 text-green-300" />
                        </button>
                        <button onClick={cancelEdit} className="p-2.5 rounded-lg bg-gray-600/20 hover:bg-gray-600/40 transition">
                          <X className="w-5 h-5 text-gray-300" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(todo)} className="p-2.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 transition">
                          <Edit2 className="w-5 h-5 text-yellow-300" />
                        </button>
                        <button onClick={() => speakText(todo.title, todo.id)} className={`p-2.5 rounded-lg transition ${isSpeaking ? 'bg-purple-600/40 animate-pulse' : 'bg-purple-600/20 hover:bg-purple-600/40'}`}>
                          <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-purple-200' : 'text-purple-300'}`} />
                        </button>
                        <div className="relative">
                          <button onClick={() => setShowTranslateMenu(showMenu ? null : todo.id)} disabled={isTranslating} className={`p-2.5 rounded-lg transition ${isTranslating ? 'bg-blue-600/40 cursor-wait' : 'bg-blue-600/20 hover:bg-blue-600/40'}`}>
                            <Globe className={`w-5 h-5 text-blue-300 ${isTranslating ? 'animate-spin' : ''}`} />
                          </button>
                          {showMenu && (
                            <div className="absolute right-0 bottom-full mb-2 bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[160px] max-h-72 overflow-y-auto">
                              {LANGUAGES.map((lang) => (
                                <button key={lang.code} onClick={() => {
                                  translateTodo(todo.id, lang.code);
                                  setShowTranslateMenu(null);
                                }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition text-left text-sm">
                                  <span className="text-xl">{lang.flag}</span>
                                  <span className="text-white">{lang.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteTodo(todo.id)} className="p-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 transition">
                          <Trash2 className="w-5 h-5 text-red-300" />
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
          <div className="text-center py-20">
            <div className="text-7xl mb-4">📝</div>
            <p className="text-white/70 text-xl">No tasks found</p>
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {fullImageView && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setFullImageView(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-50 p-4 bg-red-600/90 hover:bg-red-700 rounded-full transition shadow-2xl"
              onClick={() => setFullImageView(null)}
            >
              <X className="w-8 h-8 text-white" />
            </button>

            <img
              src={fullImageView}
              alt="Full task image"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-4 bg-black/70 backdrop-blur-xl rounded-full text-white text-base border border-white/20 sm:hidden">
              Tap anywhere outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}