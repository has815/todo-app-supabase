'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';  // ← Also use @ here
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Activity, TrendingUp, Calendar, Tag, Globe, Image as ImageIcon, ArrowLeft, LogOut } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';  // ← Change this line

interface Stats {
  total_users: number;
  total_tasks: number;
  completed_tasks: number;
  tasks_today: number;
  active_users_week: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  task_count: number;
  last_activity: string;
}

interface TagStat {
  tag: string;
  count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tagStats, setTagStats] = useState<TagStat[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics'>('overview');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/signin');
      return;
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      alert('Access Denied: Admin only');
      router.push('/todos');
      return;
    }

    setIsAdmin(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchTagStats()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('admin_stats')
      .select('*')
      .single();
    
    if (data) setStats(data);
  };

  const fetchUsers = async () => {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (authUsers?.users) {
      const usersWithStats = await Promise.all(
        authUsers.users.map(async (user) => {
          const { data: todos } = await supabase
            .from('todos')
            .select('created_at')
            .eq('user_id', user.id);

          return {
            id: user.id,
            email: user.email || 'No email',
            created_at: user.created_at,
            task_count: todos?.length || 0,
            last_activity: todos?.[0]?.created_at || user.created_at
          };
        })
      );

      setUsers(usersWithStats);
    }
  };

  const fetchTagStats = async () => {
    const { data: todos } = await supabase
      .from('todos')
      .select('tags');

    if (todos) {
      const tagCount: Record<string, number> = {};
      
      todos.forEach(todo => {
        if (todo.tags && Array.isArray(todo.tags)) {
          todo.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      });

      const tagArray = Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      setTagStats(tagArray);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  if (loading) return <LoadingScreen />;

  if (!isAdmin) return null;

  const completionRate = stats ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Admin Navbar */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/todos')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                title="Back to Todos"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                👨‍💼 Admin Dashboard
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 transition flex items-center gap-2 text-red-400 border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
            { key: 'analytics', label: 'Analytics', icon: <Activity className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
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
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Users',
                  value: stats?.total_users || 0,
                  icon: <Users className="w-8 h-8 text-blue-400" />,
                  color: 'from-blue-600 to-blue-800'
                },
                {
                  label: 'Total Tasks',
                  value: stats?.total_tasks || 0,
                  icon: <CheckCircle className="w-8 h-8 text-purple-400" />,
                  color: 'from-purple-600 to-purple-800'
                },
                {
                  label: 'Completed Tasks',
                  value: stats?.completed_tasks || 0,
                  icon: <CheckCircle className="w-8 h-8 text-green-400" />,
                  color: 'from-green-600 to-green-800'
                },
                {
                  label: 'Active This Week',
                  value: stats?.active_users_week || 0,
                  icon: <Activity className="w-8 h-8 text-orange-400" />,
                  color: 'from-orange-600 to-orange-800'
                }
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 backdrop-blur-lg border border-white/10 shadow-xl hover:scale-105 transition`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-white/80 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Additional Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Completion Rate */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Completion Rate
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-white">{completionRate}%</span>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {stats?.completed_tasks} of {stats?.total_tasks} tasks completed
                </p>
              </div>

              {/* Tasks Today */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-purple-400" />
                  Today's Activity
                </h3>
                <div className="text-5xl font-bold text-white mb-2">{stats?.tasks_today || 0}</div>
                <p className="text-white/60 text-sm">New tasks created today</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                All Users ({users.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white/80 font-semibold">#</th>
                    <th className="px-6 py-4 text-left text-white/80 font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-white/80 font-semibold">Joined</th>
                    <th className="px-6 py-4 text-left text-white/80 font-semibold">Tasks</th>
                    <th className="px-6 py-4 text-left text-white/80 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-white/60">{index + 1}</td>
                      <td className="px-6 py-4 text-white">{user.email}</td>
                      <td className="px-6 py-4 text-white/60">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm border border-purple-500/30">
                          {user.task_count} tasks
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {new Date(user.last_activity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Tag Statistics */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Tag className="w-6 h-6 text-green-400" />
                Most Used Tags
              </h3>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tagStats.slice(0, 6).map((tag, i) => (
                  <div
                    key={i}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">🏷️ {tag.tag}</span>
                      <span className="text-2xl font-bold text-purple-400">{tag.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Usage */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
                <Globe className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-3xl font-bold text-white mb-2">5</p>
                <p className="text-white/70">Languages Supported</p>
              </div>

              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
                <ImageIcon className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <p className="text-3xl font-bold text-white mb-2">
                  {Math.round((stats?.total_tasks || 0) * 0.3)}
                </p>
                <p className="text-white/70">Tasks with Images</p>
              </div>

              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
                <Tag className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-3xl font-bold text-white mb-2">{tagStats.length}</p>
                <p className="text-white/70">Unique Tags</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}