"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

interface User {
  email: string;
  user_metadata: {
    name?: string;
    job_title?: string;
  };
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en-US");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const router = useRouter();

  const languages = [
    { code: "en-US", name: "English", flag: "🇺🇸" },
    { code: "ur-PK", name: "Urdu", flag: "🇵🇰" },
    { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
    { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
    { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
    { code: "fr-FR", name: "French", flag: "🇫🇷" },
  ];

  useEffect(() => {
    checkUser();
    fetchTodos();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/signin");
    } else {
      setUser(data.user as User);
    }
  };

  const fetchTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching todos:", error);
        return;
      }
      
      if (data) setTodos(data);
    } catch (err) {
      console.error("Fetch todos error:", err);
    }
  };

  const addTodo = async () => {
    if (!newTask.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Please sign in first!");
        return;
      }

      const { data, error } = await supabase
        .from("todos")
        .insert([{ 
          task: newTask, 
          due_date: dueDate || null,
          user_id: user.id 
        }])
        .select()
        .single();
      
      if (error) {
        console.error("Error adding todo:", error);
        alert(`Error: ${error.message}`);
        return;
      }

      if (data) {
        setTodos([data, ...todos]);
        setNewTask("");
        setDueDate("");
      }
    } catch (err) {
      console.error("Add todo error:", err);
      alert("Failed to add task. Check console for details.");
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
  };

  const deleteTodo = async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    setTodos(todos.filter((t) => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.task);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    await supabase.from("todos").update({ task: editText }).eq("id", id);
    setTodos(todos.map((t) => (t.id === id ? { ...t, task: editText } : t)));
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const startVoiceInput = (forEdit = false) => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice input not supported in your browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = currentLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (forEdit) {
        setEditText(transcript);
      } else {
        setNewTask(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert("Voice recognition error");
    };

    recognition.start();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
    dueToday: todos.filter((t) => {
      if (!t.due_date) return false;
      const today = new Date().toDateString();
      return new Date(t.due_date).toDateString() === today;
    }).length,
  };

  const getTaskStatus = (todo: Todo) => {
    if (!todo.due_date) return null;
    const due = new Date(todo.due_date);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: "Overdue", color: "text-red-500", icon: "⚠️" };
    if (diffDays === 0) return { text: "Today", color: "text-yellow-500", icon: "📅" };
    if (diffDays <= 3) return { text: "Upcoming", color: "text-blue-500", icon: "📆" };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      {/* Navbar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">✨ My Todos</h1>
            
            <div className="flex items-center gap-4">
              {/* User Profile */}
              {user && (
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-lg px-4 py-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">
                      {user.user_metadata?.name || "User"}
                    </p>
                    <p className="text-white/70 text-xs">{user.email}</p>
                    {user.user_metadata?.job_title && (
                      <p className="text-white/60 text-xs">{user.user_metadata.job_title}</p>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="ml-2 px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Tasks</p>
                <p className="text-white text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/30 rounded-lg flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <p className="text-white/70 text-sm">Active</p>
                <p className="text-white text-3xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-white/70 text-sm">Completed</p>
                <p className="text-white text-3xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/30 rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
              <div>
                <p className="text-white/70 text-sm">Due Today</p>
                <p className="text-white text-3xl font-bold">{stats.dueToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Task */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-white text-xl font-semibold mb-4">Add New Task</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={() => addTodo()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all"
            >
              {editingId === todo.id ? (
                // Edit Mode
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    autoFocus
                  />
                  <button
                    onClick={() => startVoiceInput(true)}
                    disabled={isListening}
                    className={`p-2 rounded-lg ${
                      isListening ? "bg-red-500 animate-pulse" : "bg-purple-500 hover:bg-purple-600"
                    } text-white transition-all`}
                    title="Voice input"
                  >
                    🎤
                  </button>
                  <button
                    onClick={() => saveEdit(todo.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`text-white text-lg ${todo.completed ? "line-through opacity-50" : ""}`}>
                      {todo.task}
                    </p>
                    {todo.due_date && (
                      <p className="text-white/60 text-sm mt-1">
                        Due: {new Date(todo.due_date).toLocaleDateString()}
                        {getTaskStatus(todo) && (
                          <span className={`ml-2 ${getTaskStatus(todo)?.color}`}>
                            {getTaskStatus(todo)?.icon} {getTaskStatus(todo)?.text}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <button
                    onClick={() => startEdit(todo)}
                    className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/70 text-xl">No tasks yet! Add your first task above 🎯</p>
          </div>
        )}
      </div>
    </div>
  );
}