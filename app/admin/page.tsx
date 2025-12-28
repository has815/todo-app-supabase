'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, ListTodo, CheckCircle, Search } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTodos: 0, activeTodos: 0, completedTodos: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // All users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);

    // All todos
    const { data: todosData } = await supabase
      .from('todos')
      .select('id, title, completed, due_date, user_id, tags, created_at')
      .order('created_at', { ascending: false });

    setTodos(todosData || []);

    // Stats
    setStats({
      totalUsers: usersData?.length || 0,
      totalTodos: todosData?.length || 0,
      activeTodos: todosData?.filter(t => !t.completed).length || 0,
      completedTodos: todosData?.filter(t => t.completed).length || 0,
    });
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.id.includes(search)
  );

  const filteredTodos = todos.filter(todo =>
    todo.title.toLowerCase().includes(search.toLowerCase()) ||
    todo.user_id.includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-blue-950 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Admin Dashboard (Read-Only)
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <p className="text-4xl font-bold">{stats.totalUsers}</p>
            <p className="text-white/70">Total Users</p>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <ListTodo className="w-12 h-12 mx-auto mb-4 text-pink-400" />
            <p className="text-4xl font-bold">{stats.totalTodos}</p>
            <p className="text-white/70">Total Todos</p>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-4xl font-bold">{stats.activeTodos}</p>
            <p className="text-white/70">Active Todos</p>
          </div>
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <p className="text-4xl font-bold">{stats.completedTodos}</p>
            <p className="text-white/70">Completed Todos</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-6 h-6" />
            <input
              type="text"
              placeholder="Search users or todos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-lg"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">All Users ({filteredUsers.length})</h2>
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">User ID</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="p-4">{user.full_name || 'N/A'}</td>
                      <td className="p-4 text-white/70 text-xs">{user.id}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-600/30 text-purple-300' : 'bg-gray-600/30 text-gray-300'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4 text-white/70 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Todos Table */}
        <div>
          <h2 className="text-3xl font-bold mb-6">All Todos ({filteredTodos.length})</h2>
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">User ID</th>
                    <th className="p-4 text-left">Completed</th>
                    <th className="p-4 text-left">Due Date</th>
                    <th className="p-4 text-left">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTodos.map((todo) => (
                    <tr key={todo.id} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="p-4">{todo.title}</td>
                      <td className="p-4 text-white/70 text-xs">{todo.user_id.slice(0, 8)}...</td>
                      <td className="p-4">
                        {todo.completed ? (
                          <span className="text-green-400 font-medium">Yes</span>
                        ) : (
                          <span className="text-red-400 font-medium">No</span>
                        )}
                      </td>
                      <td className="p-4 text-white/70">
                        {todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        {todo.tags?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {todo.tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/50">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}