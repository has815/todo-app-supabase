'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Admin emails - CHANGE THIS TO YOUR EMAIL
const ADMIN_EMAILS = ['bhattihaseeb008@gmail.com'];

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  role?: string;
}

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  user_id: string;
  user_email?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'todos'>('overview');
  
  const [users, setUsers] = useState<User[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTodos: 0,
    completedTodos: 0,
    activeTodos: 0
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        router.push('/signin');
        return;
      }

      if (!session) {
        console.log('No session found');
        router.push('/signin');
        return;
      }

      const userEmail = session.user.email;
      console.log('Logged in as:', userEmail);

      // Check if user is admin
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        alert('⛔ Access Denied: Admin privileges required');
        router.push('/todos');
        return;
      }

      console.log('✅ Admin access granted');
      setIsAdmin(true);
      
      // Load data
      await Promise.all([
        fetchAllUsers(),
        fetchAllTodos()
      ]);
    } catch (error) {
      console.error('Admin check error:', error);
      alert('Error checking admin access');
      router.push('/todos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setStats(prev => ({ ...prev, totalUsers: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAllTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const todosWithEmail = data?.map(todo => ({
        ...todo,
        user_email: (todo.profiles as any)?.email
      })) || [];

      setTodos(todosWithEmail);
      
      const completed = todosWithEmail.filter(t => t.completed).length;
      setStats(prev => ({
        ...prev,
        totalTodos: todosWithEmail.length,
        completedTodos: completed,
        activeTodos: todosWithEmail.length - completed
      }));
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!confirm('Delete this todo?')) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;

      alert('✅ Todo deleted successfully');
      await fetchAllTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('❌ Error deleting todo');
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Change role to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`✅ Role changed to ${newRole}`);
      await fetchAllUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('❌ Error updating role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">👑 Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, todos, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['overview', 'users', 'todos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-purple-600 text-3xl mb-2">👥</div>
              <h3 className="text-gray-600 text-sm">Total Users</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-blue-600 text-3xl mb-2">📋</div>
              <h3 className="text-gray-600 text-sm">Total Todos</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.totalTodos}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-green-600 text-3xl mb-2">✅</div>
              <h3 className="text-gray-600 text-sm">Completed</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.completedTodos}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-orange-600 text-3xl mb-2">⏳</div>
              <h3 className="text-gray-600 text-sm">Active</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.activeTodos}</p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 All Users ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-gray-600">Email</th>
                    <th className="text-left p-3 text-gray-600">Name</th>
                    <th className="text-left p-3 text-gray-600">Role</th>
                    <th className="text-left p-3 text-gray-600">Joined</th>
                    <th className="text-left p-3 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.full_name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleUserRole(user.id, user.role || 'user')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Todos Tab */}
        {activeTab === 'todos' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 All Todos ({todos.length})</h2>
            <div className="space-y-4">
              {todos.map((todo) => (
                <div key={todo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-2xl ${todo.completed ? '✅' : '⏳'}`}>
                          {todo.completed ? '✅' : '⏳'}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-800">{todo.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-2">{todo.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>👤 {todo.user_email}</span>
                        <span>📅 {new Date(todo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}