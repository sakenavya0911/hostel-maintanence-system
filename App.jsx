import React, { useState, useEffect, Component } from 'react';
import { LoginPage } from './components/LoginPage.jsx';
import { Header } from './components/Header.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { WardenDashboard } from './components/dashboards/WardenDashboard.jsx';
import { StudentDashboard } from './components/dashboards/StudentDashboard.jsx';
import { GateStaffDashboard } from './components/dashboards/GateStaffDashboard.jsx';
import { RegisterStaffDashboard } from './components/dashboards/RegisterStaffDashboard.jsx';
import { getDB, resetDB } from './services/dbService.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="p-8 max-w-md w-full bg-white rounded-3xl shadow-2xl border border-red-200 text-slate-800 space-y-4 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              !
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Application Recovered</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              A temporary rendering glitch or browser cache conflict was detected. Click below to reload or reset clean application data.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Reset Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function App() {
  const [db, setDb] = useState(() => getDB());

  // Restore session from localStorage if present
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('joy_hostel_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'Warden') parsed.name = 'Prasanna Devi';
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem('joy_hostel_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.role === 'Student' ? 'profile' : 'overview';
      } catch (e) {
        return 'overview';
      }
    }
    return 'overview';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Listen to DB updates
  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('joy_db_updated', handleDbUpdate);
    return () => window.removeEventListener('joy_db_updated', handleDbUpdate);
  }, []);

  const refreshDB = () => {
    setDb(getDB());
  };

  // Demo user credentials authentication handler
  const handleLogin = (emailInput, passwordInput, roleInput) => {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const targetRole = roleInput || 'Warden';

    const validUsers = [
      {
        email: 'warden@joyuniversity.edu',
        pass: 'warden123',
        role: 'Warden',
        name: 'Prasanna Devi',
        phone: '+91 98765 11223'
      },
      {
        email: 'student@joyuniversity.edu',
        pass: 'student123',
        role: 'Student',
        name: 'Navya',
        studentId: 'STU001',
        department: 'Computer Science',
        blockName: 'Apple Block',
        roomNumber: 'A101',
        bedNumber: 'Bed 1'
      },
      {
        email: 'gate@joyuniversity.edu',
        pass: 'gate123',
        role: 'Main Gate Staff',
        name: 'Ramesh Kumar (Gate Supervisor)'
      },
      {
        email: 'register@joyuniversity.edu',
        pass: 'register123',
        role: 'Register Office Staff',
        name: 'Sarah Jenkins (Registrar Office)'
      }
    ];

    // Priority 1: Exact email match
    let found = validUsers.find(u => u.email.toLowerCase() === cleanEmail);
    // Priority 2: Role match
    if (!found) {
      found = validUsers.find(u => u.role === targetRole);
    }

    const finalRole = found ? found.role : targetRole;
    const finalName = found ? found.name : (targetRole === 'Warden' ? 'Prasanna Devi' : (targetRole === 'Student' ? 'Navya' : `${targetRole} Officer`));

    const userSession = {
      email: found ? found.email : cleanEmail || 'warden@joyuniversity.edu',
      role: finalRole,
      name: finalName,
      studentId: found ? found.studentId : (finalRole === 'Student' ? 'STU001' : null),
      department: found ? found.department : (finalRole === 'Student' ? 'Computer Science' : null),
      blockName: found ? found.blockName : (finalRole === 'Student' ? 'Apple Block' : null),
      roomNumber: found ? found.roomNumber : (finalRole === 'Student' ? 'A101' : null),
      bedNumber: found ? found.bedNumber : (finalRole === 'Student' ? 'Bed 1' : null)
    };

    setCurrentUser(userSession);
    localStorage.setItem('joy_hostel_user', JSON.stringify(userSession));
    setActiveTab(finalRole === 'Student' ? 'profile' : 'overview');
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('joy_hostel_user');
    setIsMobileSidebarOpen(false);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            role={currentUser.role}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            isMobileOpen={isMobileSidebarOpen}
            closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {currentUser.role === 'Warden' && (
              <WardenDashboard activeTab={activeTab} setActiveTab={setActiveTab} db={db} refreshDB={refreshDB} />
            )}

            {currentUser.role === 'Student' && (
              <StudentDashboard
                currentUser={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                db={db}
                refreshDB={refreshDB}
              />
            )}

            {currentUser.role === 'Main Gate Staff' && (
              <GateStaffDashboard activeTab={activeTab} db={db} refreshDB={refreshDB} />
            )}

            {currentUser.role === 'Register Office Staff' && (
              <RegisterStaffDashboard activeTab={activeTab} db={db} refreshDB={refreshDB} />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
