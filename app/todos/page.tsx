'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, Plus, Trash2, Calendar, CheckCircle, Circle, Filter, Mic, Edit2, Languages, X, Check, Menu } from 'lucide-react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  due_date: string;
  user_id: string;
  created_at: string;
}

export default function TodosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [currentLang, setCurrentLang] = useState('en');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const translations: Record<string, any> = {
    en: { 
      addTask: 'Add Task', 
      tasks: 'Tasks', 
      profile: 'Profile', 
      totalTasks: 'Total Tasks', 
      active: 'Active', 
      completed: 'Completed', 
      dueToday: 'Due Today', 
      all: 'All', 
      language: 'Language',
      addNewTask: 'Add a new task...',
      activeNow: 'Active now'
    },
    ur: { 
      addTask: 'ٹاسک شامل کریں', 
      tasks: 'ٹاسک', 
      profile: 'پروفائل', 
      totalTasks: 'کل ٹاسک', 
      active: 'فعال', 
      completed: 'مکمل', 
      dueToday: 'آج واجب', 
      all: 'سب', 
      language: 'زبان',
      addNewTask: 'نیا ٹاسک شامل کریں...',
      activeNow: 'فعال ابھی'
    },
    hi: { 
      addTask: 'कार्य जोड़ें', 
      tasks: 'कार्य', 
      profile: 'प्रोफ़ाइल', 
      totalTasks: 'कुल कार्य', 
      active: 'सक्रिय', 
      completed: 'पूर्ण', 
      dueToday: 'आज नियत', 
      all: 'सभी', 
      language: 'भाषा',
      addNewTask: 'नया कार्य जोड़ें...',
      activeNow: 'अभी सक्रिय'
    },
    es: { 
      addTask: 'Agregar Tarea', 
      tasks: 'Tareas', 
      profile: 'Perfil', 
      totalTasks: 'Total', 
      active: 'Activas', 
      completed: 'Completadas', 
      dueToday: 'Hoy', 
      all: 'Todas', 
      language: 'Idioma',
      addNewTask: 'Agregar nueva tarea...',
      activeNow: 'Activo ahora'
    },
    ja: { 
      addTask: '追加', 
      tasks: 'タスク', 
      profile: 'プロフィール', 
      totalTasks: '合計', 
      active: '進行中', 
      completed: '完了', 
      dueToday: '今日', 
      all: 'すべて', 
      language: '言語',
      addNewTask: '新しいタスクを追加...',
      activeNow: '今アクティブ'
    },
    fr: { 
      addTask: 'Ajouter', 
      tasks: 'Tâches', 
      profile: 'Profil', 
      totalTasks: 'Total', 
      active: 'Actives', 
      completed: 'Terminées', 
      dueToday: "Aujourd'hui", 
      all: 'Toutes', 
      language: 'Langue',
      addNewTask: 'Ajouter une nouvelle tâche...',
      activeNow: 'Actif maintenant'
    }
  };

  const t = translations[currentLang];

  useEffect(() => {
    checkUser();
    fetchTodos();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/signin';
      return;
    }
    setUser(user);
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

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = (isEditing = false) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in your browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    const langMap: Record<string, string> = {
      'ur': 'ur-PK',
      'hi': 'hi-IN',
      'es': 'es-ES',
      'ja': 'ja-JP',
      'fr': 'fr-FR',
      'en': 'en-US'
    };
    
    recognition.lang = langMap[currentLang] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (isEditing) {
        setEditText(transcript);
      } else {
        setNewTodo(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo,
            completed: false,
            due_date: dueDate || new Date(Date.now() + 86400000).toISOString(),
            user_id: user.id
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTodos([data[0], ...todos]);
        setNewTodo('');
        setDueDate('');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.title);
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editText })
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.map(t => t.id === id ? { ...t, title: editText } : t));
      setEditingId(null);
      setEditText('');
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

  const getDueStatus = (dueDate: string) => {
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
            <div className="flex items-center gap-4 sm:gap-8">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Todo App
              </h1>
              <div className="hidden md:flex gap-6">
                <button className="text-white/80 hover:text-white transition flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {t.tasks}
                </button>
                <button className="text-white/60 hover:text-white/80 transition text-sm">
                  {t.profile}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur-lg border border-white/10"
                >
                  <Languages className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm hidden sm:inline">{languages.find(l => l.code === currentLang)?.name}</span>
                  <span className="text-white text-sm sm:hidden">{languages.find(l => l.code === currentLang)?.flag}</span>
                </button>
                
                {showLangMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowLangMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setCurrentLang(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition flex items-center gap-3 ${
                            currentLang === lang.code ? 'bg-purple-600/30 text-purple-300' : 'text-white/80'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className="text-sm">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* User Profile */}
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white text-sm font-medium">{user.email?.split('@')[0]}</p>
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      {t.activeNow}
                    </p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: t.totalTasks, value: stats.total, color: 'from-purple-600 to-purple-800', icon: '📋' },
            { label: t.active, value: stats.active, color: 'from-blue-600 to-blue-800', icon: '⚡' },
            { label: t.completed, value: stats.completed, color: 'from-green-600 to-green-800', icon: '✅' },
            { label: t.dueToday, value: stats.dueToday, color: 'from-orange-600 to-orange-800', icon: '🔔' }
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

        {/* Add Task Card */}
        <div className="bg-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder={t.addNewTask}
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              <button
                onClick={() => startVoiceInput(false)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition ${
                  isListening ? 'bg-red-600 animate-pulse' : 'bg-purple-600/30 hover:bg-purple-600/50'
                }`}
                title="Voice Input"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            </div>

            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
            />

            <button
              onClick={addTodo}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition shadow-lg hover:shadow-purple-500/50"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t.addTask}</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 sm:px-6 py-2 rounded-xl font-medium transition whitespace-nowrap text-sm ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {t[f]} ({f === 'all' ? stats.total : f === 'active' ? stats.active : stats.completed})
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const dueStatus = getDueStatus(todo.due_date);
            const isEditing = editingId === todo.id;

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
                        <button
                          onClick={() => startVoiceInput(true)}
                          className={`p-2 rounded-lg transition flex-shrink-0 ${
                            isListening ? 'bg-red-600 animate-pulse' : 'bg-purple-600/30 hover:bg-purple-600/50'
                          }`}
                        >
                          <Mic className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className={`text-white font-medium break-words ${todo.completed ? 'line-through opacity-60' : ''}`}>
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Calendar className={`w-3 h-3 ${dueStatus.color}`} />
                          <span className={`text-xs ${dueStatus.color}`}>
                            {dueStatus.icon} {new Date(todo.due_date).toLocaleString(currentLang)}
                          </span>
                          {dueStatus.status === 'overdue' && (
                            <span className="text-xs bg-red-600/20 px-2 py-0.5 rounded text-red-400">
                              {dueStatus.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                      <button
                        onClick={() => startEdit(todo)}
                        className="p-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5 text-yellow-400" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
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