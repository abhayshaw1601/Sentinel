import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Search, Settings, LayoutGrid, Users, UserRound, FileText, LogOut, Sun, Moon, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { patientAPI, authAPI } from '../utils/api';
import logo from '../assets/logo.png';
import './AppShell.css';

const AppShell = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ patients: [], staff: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const runSearch = useCallback(async (q) => {
    if (q.length < 2) {
      setResults({ patients: [], staff: [] });
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const [pRes, sRes] = await Promise.all([
        patientAPI.getAll({ status: 'admitted' }),
        authAPI.getMyStaff(),
      ]);
      const lower = q.toLowerCase();
      const patients = (pRes.data.data || []).filter(p =>
        p.name?.toLowerCase().includes(lower) ||
        p.patientId?.toLowerCase().includes(lower) ||
        p.ward?.toLowerCase().includes(lower)
      ).slice(0, 5);
      const staff = (sRes.data.data || sRes.data || []).filter(s =>
        s.name?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower) ||
        s.role?.toLowerCase().includes(lower)
      ).slice(0, 4);
      setResults({ patients, staff });
    } catch {
      setResults({ patients: [], staff: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); }
  };

  const goToPatient = (id) => {
    setSearchOpen(false); setQuery('');
    navigate(`/patient/${id}`);
  };

  const goToStaff = () => {
    setSearchOpen(false); setQuery('');
    navigate('/staff');
  };

  const hasResults = results.patients.length > 0 || results.staff.length > 0;

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell ${isDarkMode ? 'dark' : ''}`}>
      <aside className="app-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          <img src={logo} alt="Sentinel" className="sidebar-logo" />
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Sentinel</div>
            <div className="sidebar-brand-sub">Clinical Guardian</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutGrid size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/patients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Patients</span>
          </NavLink>

          <NavLink to="/staff" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserRound size={18} />
            <span>Staff</span>
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            <span>Reports</span>
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{(user?.role || '').toUpperCase()}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-search" ref={searchRef}>
            <Search size={18} className="topbar-search-icon" />
            <input
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setSearchOpen(true)}
              placeholder="Search patients, staff..."
              autoComplete="off"
            />
            {searchOpen && (
              <div className="search-dropdown">
                {searchLoading && (
                  <div className="search-empty">Searching…</div>
                )}
                {!searchLoading && !hasResults && (
                  <div className="search-empty">No results for "{query}"</div>
                )}
                {!searchLoading && results.patients.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-label">Patients</div>
                    {results.patients.map(p => (
                      <button key={p._id} className="search-result-item" onClick={() => goToPatient(p._id)}>
                        <div className="search-result-icon patient-icon"><Users size={14} /></div>
                        <div className="search-result-text">
                          <div className="search-result-name">{p.name}</div>
                          <div className="search-result-sub">{p.patientId}{p.ward ? ` · ${p.ward}` : ''}</div>
                        </div>
                        <span className={`search-badge status-${p.status}`}>{p.status}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!searchLoading && results.staff.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-label">Staff</div>
                    {results.staff.map(s => (
                      <button key={s._id} className="search-result-item" onClick={goToStaff}>
                        <div className="search-result-icon staff-icon"><User size={14} /></div>
                        <div className="search-result-text">
                          <div className="search-result-name">{s.name}</div>
                          <div className="search-result-sub">{s.role} · {s.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="topbar-actions">
            <button className="topbar-icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="topbar-icon-btn" aria-label="Logout" onClick={onLogout} title="Logout">
              <LogOut size={18} />
            </button>
            <button className="topbar-user-pill" onClick={() => navigate('/dashboard')}>
              <div className="pill-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
              <div className="pill-text">
                <div className="pill-name">{user?.name || 'User'}</div>
                <div className="pill-role">{user?.role === 'admin' ? 'CHIEF CLINICIAN' : (user?.role || '').toUpperCase()}</div>
              </div>
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;

