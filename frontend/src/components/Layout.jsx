import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, CheckSquare, 
  CreditCard, BarChart2, Activity, LogOut, Bell, Menu, X, ChevronRight, User
} from 'lucide-react';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Retrieve user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Vendors', path: '/vendors', icon: Users, roles: ['admin', 'manager'] },
    { name: 'RFQs', path: '/rfqs', icon: FileText, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Quotations', path: '/quotations', icon: CheckSquare, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['admin', 'manager', 'vendor'] },
    { name: 'POs & Invoices', path: '/purchase-orders', icon: CreditCard, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['admin', 'manager'] },
    { name: 'Activity Log', path: '/activity', icon: Activity, roles: ['admin', 'manager'] },
  ];

  // Filter menu items by user role
  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role || 'vendor'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    const active = menuItems.find(item => item.path === location.pathname);
    return active ? active.name : 'VendorBridge';
  };

  return (
    <div className="h-screen w-screen flex bg-dark-950 text-slate-100 font-sans overflow-hidden mesh-bg">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col glass-panel border-r border-slate-800/50 transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          lg:relative`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="font-display font-bold text-white text-lg">V</span>
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                VendorBridge
              </span>
            )}
          </div>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-100 border border-transparent'}`}
              >
                <Icon size={20} className={isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'} />
                {!collapsed && <span>{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-white rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-800/40">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-brand-400 border border-slate-700">
                <User size={20} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </p>
                  <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {user.role}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40 glass-panel">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="hidden lg:block text-slate-400 hover:text-white"
            >
              <ChevronRight size={20} className={`transform transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            </button>
            <h1 className="text-lg font-bold font-display text-white">
              {getPageTitle()}
            </h1>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Portal */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
