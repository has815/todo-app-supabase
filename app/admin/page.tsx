'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Users, ClipboardList, Trash2, ArrowLeft, Ban, CheckCircle, TrendingUp } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  role: string;
  created_at: string;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  user_id: string;
  created_at: string;
  tags: string[];
  users: {
    email: string;
    profiles: {
      full_name: string;
    }[];
  };
}

const ADMIN_EMAILS = ['hassanahmed12168@gmail.com'];

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'todos'>('overview');
  
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/signin');
        return;
      }

      // Check if user is admin
      if (!ADMIN_EMAILS.includes(user.email || '')) {
        alert('⛔ Access Denied: Admin privileges required');
        router.push('/todos');
        return;
      }

      setIsAdmin(true);
      await Promise.all([
        fetchAllUsers(),
        fetchAllTodos()
      ]);
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/todos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      if (!authUsers) return;

      const usersWithProfiles = await Promise.all(
        authUsers.users.map(async (user) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, job_title, role')
            .eq('user_id', user.id)
            .single();

          return {
            id: user.id,
            email: user.email || 'No email',
            full_name: profile?.full_name || 'Unknown',
            job_title: profile?.job_title || 'User',
            role: profile?.role || 'user',
            created_at: user.created_at
          };
        })
      );

      setUsers(usersWithProfiles);
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
          users:user_id (
            email,
            profiles:profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setAllTodos(data as any);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const deleteUserTodo = async (todoId: string, userEmail: string) => {
    if (!confirm(`Delete this todo from ${userEmail}?`)) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (!error) {
        setAllTodos(allTodos.filter(t => t.id !== todoId));
        alert('✅ Todo deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('❌ Failed to delete todo');
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (!error) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        alert(`✅ User role updated to ${newRole}!`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('❌ Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const stats = {
    totalUsers: users.length,
    totalTodos: allTodos.length,
    completedTodos: allTodos.filter(t => t.completed).length,
    admins: users.filter(u => u.role === 'admin').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/todos')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <Shield className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'from-blue-600 to-blue-800', icon: <Users className="w-8 h-8" /> },
            { label: 'Total Todos', value: stats.totalTodos, color: 'from-purple-600 to-purple-800', icon: <ClipboardList className="w-8 h-8" /> },
            { label: 'Completed', value: stats.completedTodos, color: 'from-green-600 to-green-800', icon: <CheckCircle className="w-8 h-8" /> },
            { label: 'Admins', value: stats.admins, color: 'from-yellow-600 to-orange-800', icon: <Shield className="w-8 h-8" /> }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 backdrop-blur-lg border border-white/10 shadow-xl`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className="text-white/60">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
            { key: 'todos', label: 'All Todos', icon: <ClipboardList className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">System Overview</h2>
            
            <div className="grid gap-6">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {allTodos.slice(0, 5).map((todo) => (
                    <div key={todo.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white text-sm">{todo.title}</p>
                        <p className="text-white/60 text-xs mt-1">
                          by {todo.users?.profiles?.[0]?.full_name || todo.users?.email || 'Unknown'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        todo.completed ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {todo.completed ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">User Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2">
                    <span className="text-white/70">Active Users:</span>
                    <span className="text-white font-bold">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-white/70">Completion Rate:</span>
                    <span className="text-white font-bold">
                      {stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Joined</th>
                    <th className="text-center py-3 px-4 text-white/70 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-4 px-4 text-white text-sm">{user.email}</td>
                      <td className="py-4 px-4 text-white text-sm">{user.full_name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' 
                            : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        }`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white/70 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => toggleUserRole(user.id, user.role)}
                            className={`p-2 rounded-lg transition ${
                              user.role === 'admin'
                                ? 'bg-red-600/20 hover:bg-red-600/30'
                                : 'bg-yellow-600/20 hover:bg-yellow-600/30'
                            }`}
                            title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          >
                            {user.role === 'admin' ? (
                              <Ban className="w-4 h-4 text-red-400" />
                            ) : (
                              <Shield className="w-4 h-4 text-yellow-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Todos Tab */}
        {activeTab === 'todos' && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">All Todos ({allTodos.length})</h2>
            
            <div className="space-y-3">
              {allTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`bg-white/5 rounded-xl p-4 border transition ${
                    todo.completed ? 'border-green-500/30' : 'border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {todo.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                        )}
                        <p className={`text-white font-medium ${todo.completed ? 'line-through opacity-60' : ''}`}>
                          {todo.title}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-white/60">
                          👤 {todo.users?.profiles?.[0]?.full_name || todo.users?.email || 'Unknown'}
                        </span>
                        
                        {todo.tags && todo.tags.length > 0 && (
                          <div className="flex gap-1">
                            {todo.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {todo.due_date && (
                          <span className="text-xs text-white/60">
                            📅 {new Date(todo.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteUserTodo(todo.id, todo.users?.email || 'user')}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 transition"
                      title="Delete Todo"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
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