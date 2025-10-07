import { useState, useEffect } from 'react';
import { LogOut, Clock, Shield, User } from 'lucide-react';
import { supabase, WorkLog, Holiday, getUserRole } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { WorkLogForm } from './components/WorkLogForm';
import { LogHistory } from './components/LogHistory';
import { HoursSummary } from './components/HoursSummary';
import { HolidayCalculator } from './components/HolidayCalculator';
import { EditLogModal } from './components/EditLogModal';
import { UserProfile } from './components/UserProfile';

function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('staff');
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserRoleAndData();
    }
  }, [user]);

  const loadUserRoleAndData = async () => {
    const role = await getUserRole(user.id);
    setUserRole(role);
    fetchLogs(role);
    fetchHolidays();
  };

  const fetchLogs = async (role?: 'admin' | 'staff') => {
    const currentRole = role || userRole;

    const { data, error } = await supabase
      .from('work_logs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return;
    }

    if (currentRole === 'admin') {
      const userIds = Array.from(new Set(data?.map(log => log.user_id) || []));

      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', userIds);

      const { data: authUsersData } = await supabase.auth.admin.listUsers();

      const userInfoMap: { [key: string]: string } = {};
      userRolesData?.forEach(ur => {
        if (ur.first_name && ur.last_name) {
          userInfoMap[ur.user_id] = `${ur.first_name} ${ur.last_name}`;
        } else if (ur.email) {
          userInfoMap[ur.user_id] = ur.email;
        }
      });

      authUsersData?.users?.forEach(authUser => {
        if (!userInfoMap[authUser.id]) {
          userInfoMap[authUser.id] = authUser.email || 'Unknown';
        }
      });

      const logsWithEmail = (data || []).map(log => ({
        ...log,
        user_email: userInfoMap[log.user_id] || 'Unknown'
      }));

      setLogs(logsWithEmail);
    } else {
      setLogs(data || []);
    }
  };

  const fetchHolidays = async () => {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching holidays:', error);
    } else {
      setHolidays(data || []);
    }
  };

  const handleAuth = async (email: string, password: string, isSignUp: boolean, firstName?: string, lastName?: string) => {
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user && firstName && lastName) {
        const { error: profileError } = await supabase
          .from('user_roles')
          .update({ first_name: firstName, last_name: lastName })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLogs([]);
    setHolidays([]);
  };

  const handleSaveLog = async (data: {
    date: string;
    time_in: string;
    time_out: string;
    break_minutes: number;
  }) => {
    const { error } = await supabase
      .from('work_logs')
      .insert([{ ...data, user_id: user.id }]);

    if (error) {
      if (error.code === '23505') {
        alert('A log entry already exists for this date. Please edit the existing entry instead.');
      } else {
        console.error('Error saving log:', error);
        alert('Error saving log. Please try again.');
      }
    } else {
      await fetchLogs();
    }
  };

  const handleUpdateLog = async (id: string, data: {
    date: string;
    time_in: string;
    time_out: string;
    break_minutes: number;
  }) => {
    const { error } = await supabase
      .from('work_logs')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating log:', error);
      alert('Error updating log. Please try again.');
    } else {
      await fetchLogs();
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log entry?')) return;

    const { error } = await supabase
      .from('work_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting log:', error);
      alert('Error deleting log. Please try again.');
    } else {
      await fetchLogs();
    }
  };

  const handleSaveHolidayToWeek = async (hours: number) => {
    const today = new Date();
    const holidayDate = today.toISOString().split('T')[0];

    const { error } = await supabase
      .from('work_logs')
      .insert([{
        user_id: user.id,
        date: holidayDate,
        time_in: '09:00:00',
        time_out: '17:00:00',
        break_minutes: Math.round((8 - hours) * 60),
      }]);

    if (error) {
      if (error.code === '23505') {
        alert('A log entry already exists for today. Please edit it manually.');
      } else {
        console.error('Error saving holiday hours:', error);
        alert('Error saving holiday hours. Please try again.');
      }
    } else {
      await fetchLogs();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Hour Logger Pro</h1>
              {userRole === 'admin' && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <HoursSummary logs={logs} holidays={holidays} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <WorkLogForm onSave={handleSaveLog} />
          <HolidayCalculator onSaveToWeek={handleSaveHolidayToWeek} />
        </div>

        <LogHistory
          logs={logs}
          onEdit={setEditingLog}
          onDelete={handleDeleteLog}
          isAdmin={userRole === 'admin'}
        />
      </main>

      <EditLogModal
        log={editingLog}
        onClose={() => setEditingLog(null)}
        onSave={handleUpdateLog}
      />

      {showProfile && (
        <UserProfile
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={() => fetchLogs()}
        />
      )}
    </div>
  );
}

export default App;
