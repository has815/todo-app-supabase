'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/app/components/Navbar';  
import { Plus, Trash2, Edit2, Check, X, Calendar, Volume2, Languages } from 'lucide-react';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  user_id: string;
  due_date: string | null;
  language?: string;
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

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
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/signin');
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, job_title')
          .eq('id', session.user.id)
          .single();

        if (profileData && !profileError) {
          setUserInfo({
            name: profileData.full_name || 'User',
            job: profileData.job_title || 'Professional',
          });
        } else {
          setUserInfo({
            name: session.user.email?.split('@')[0] || 'User',
            job: 'Professional',
          });
        }
      } catch (profileErr) {
        setUserInfo({
          name: session.user.email?.split('@')[0] || 'User',
          job: 'Professional',
        });
      }

      await loadTodos();
    } catch (error) {
      console.error('Error loading data:', error);
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

      if (!error && data) {
        setTodos(data);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      return data[0][0][0];
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const handleTranslate = async (todoId: string, text: string, targetLang: string) => {
    setTranslatingId(todoId);
    setShowLangMenu(null);

    try {
      const translatedText = await translateText(text, targetLang);
      
      const { error } = await supabase
        .from('todos')
        .update({ 
          title: translatedText,
          language: targetLang 
        })
        .eq('id', todoId);

      if (!error) {
        setTodos(todos.map(t => 
          t.id === todoId 
            ? { ...t, title: translatedText, language: targetLang } 
            : t
        ));
        
        // Success notification
        const langName = LANGUAGES.find(l => l.code === targetLang)?.name;
        alert(`✅ Translated to ${langName}!`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('❌ Translation failed. Please try again.');
    } finally {
      setTranslatingId(null);
    }
  };

  const speakTodo = (id: string, text: string, language: string = 'en') => {
    try {
      window.speechSynthesis.cancel();
      
      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language for speech
      const langMap: any = {
        'en': 'en-US',
        'ur': 'ur-PK',
        'ja': 'ja-JP',
        'es': 'es-ES',
        'hi': 'hi-IN',
      };
      
      utterance.lang = langMap[language] || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      setSpeakingId(id);
      
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        setSpeakingId(null);
      };

      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setSpeakingId(null);
      alert('⚠️ Text-to-speech is not supported in your browser.');
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please login again.');
        router.push('/signin');
        return;
      }

      const { data, error } = await supabase
        .from('todos')
        .insert([{
          title: newTodo.trim(),
          completed: false,
          user_id: session.user.id,
          due_date: newDueDate || null,
          language: 'en',
        }])
        .select()
        .single();

      if (!error && data) {
        setTodos([data, ...todos]);
        setNewTodo('');
        setNewDueDate('');
      } else {
        console.error('Add todo error:', error);
        alert('Failed to add todo. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAdding(false);
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
      console.error('Toggle error:', error);
    }
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

    try {
      const { error } = await supabase
        .from('todos')
        .update({ 
          title: editingText.trim(),
          due_date: editingDueDate || null,
        })
        .eq('id', id);

      if (!error) {
        setTodos(todos.map(t => t.id === id ? { ...t, title: editingText.trim(), due_date: editingDueDate || null } : t));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Edit error:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm('🗑️ Delete this todo?')) return;
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (!error) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const isOverdue = (d: string | null) => d ? new Date(d) < new Date(new Date().setHours(0,0,0,0)) : false;
  const isToday = (d: string | null) => d ? new Date(d).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) : false;
  const isUpcoming = (d: string | null) => d ? new Date(d) > new Date(new Date().setHours(0,0,0,0)) : false;

  const formatDate = (d: string | null) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
    if (diff === 0) return '📅 Today';
    if (diff === 1) return '📅 Tomorrow';
    if (diff === -1) return '⚠️ Yesterday';
    if (diff < -1) return `⚠️ ${Math.abs(diff)} days overdue`;
    if (diff > 1) return `📅 In ${diff} days`;
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
          <p className="text-lg font-semibold">Loading your todos...</p>
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
        {/* Statistics */}
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
                filter === f ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Add Todo Form */}
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
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Todos List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <Check className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg font-medium">
                {filter === 'all' ? 'No todos yet! Add your first task.' : `No ${filter} todos.`}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {filter === 'all' && 'Start by adding a task above ☝️'}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white/10 backdrop-blur-sm border rounded-xl p-4 hover:bg-white/15 transition-all ${
                  isOverdue(todo.due_date) && !todo.completed ? 'border-red-500/50 shadow-red-500/20 shadow-lg' :
                  isToday(todo.due_date) && !todo.completed ? 'border-blue-500/50 shadow-blue-500/20 shadow-lg' : 'border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-1 ${
                      todo.completed ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50' : 'border-gray-400 hover:border-purple-400 hover:shadow-lg'
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
                          className="w-full px-3 py-2 bg-white/20 border border-purple-400 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                          placeholder="Edit todo..."
                        />
                        <input
                          type="date"
                          value={editingDueDate}
                          onChange={(e) => setEditingDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white/20 border border-purple-400 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`block text-white text-lg ${todo.completed ? 'line-through text-gray-400' : 'font-medium'}`}>
                            {todo.title}
                          </span>
                          {todo.language && todo.language !== 'en' && (
                            <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded">
                              {LANGUAGES.find(l => l.code === todo.language)?.flag || '🌐'}
                            </span>
                          )}
                        </div>
                        {todo.due_date && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium ${
                              isOverdue(todo.due_date) && !todo.completed ? 'text-red-400' :
                              isToday(todo.due_date) && !todo.completed ? 'text-blue-400' : 'text-gray-400'
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
                        <button 
                          onClick={() => saveEdit(todo.id)} 
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition"
                          title="Save"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition"
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => speakTodo(todo.id, todo.title, todo.language || 'en')}
                          className={`p-2 rounded-lg transition ${
                            speakingId === todo.id ? 'text-purple-400 bg-purple-500/30 animate-pulse' : 'text-purple-400 hover:bg-purple-500/20'
                          }`}
                          title="Read aloud"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setShowLangMenu(showLangMenu === todo.id ? null : todo.id)}
                            disabled={translatingId === todo.id}
                            className={`p-2 rounded-lg transition ${
                              translatingId === todo.id ? 'text-yellow-400 bg-yellow-500/30 animate-pulse' : 'text-yellow-400 hover:bg-yellow-500/20'
                            }`}
                            title="Translate"
                          >
                            <Languages className="w-5 h-5" />
                          </button>
                          
                          {showLangMenu === todo.id && (
                            <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-10 min-w-[160px]">
                              {LANGUAGES.map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() => handleTranslate(todo.id, todo.title, lang.code)}
                                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition flex items-center gap-2"
                                >
                                  <span className="text-xl">{lang.flag}</span>
                                  <span className="text-sm">{lang.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => startEdit(todo.id, todo.title, todo.due_date)} 
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteTodo(todo.id)} 
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                          title="Delete"
                        >
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

        {/* Footer Info */}
        {userInfo && (
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>🌍 Multilingual support: English, Urdu, Japanese, Spanish, Hindi</p>
            <p className="mt-1">👤 Tasks for: <span className="text-purple-300 font-medium">{userInfo.name}</span> ({userInfo.job})</p>
          </div>
        )}
      </div>
    </div>
  );
}