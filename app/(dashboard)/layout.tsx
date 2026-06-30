"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Hammer, 
  LayoutDashboard, 
  Settings, 
  Sliders, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Search, 
  Bell, 
  User, 
  Sparkles,
  ChevronRight,
  FolderOpen,
  FileClock,
  Boxes
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const navItems = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      description: 'System stats & recent forms'
    },
    {
      name: 'Form Builder',
      href: '/settings',
      icon: Sliders,
      description: 'Visual & JSON generator'
    },
    {
      name: 'Order Overdue',
      href: '/overdue',
      icon: FileClock,
      description: 'Database CRUD PO manager'
    },
    {
      name: 'Stocks',
      href: '/stocks',
      icon: Boxes,
      description: 'Inventory & alerts'
    }
  ];

  const getPageTitle = () => {
    if (pathname === '/') return 'Overview';
    if (pathname === '/settings') return 'Form Builder';
    if (pathname === '/overdue') return 'Order Overdue';
    if (pathname === '/stocks') return 'Stocks';
    return 'Dashboard';
  };

  // Close sidebar on mobile navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!isMounted) {
    return (
      <div className="flex-1 bg-background text-foreground min-h-screen flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground min-h-screen flex flex-col font-sans transition-all duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/80 bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 animate-pulse">
              <Hammer className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                FormEngine
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Zero-DB Platform</span>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <div className="px-2 mb-1.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Navigation</span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-foreground'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <div className="flex flex-col text-left">
                    <span>{item.name}</span>
                    <span className={`text-[9px] font-normal ${isActive ? 'text-primary-foreground/75' : 'text-muted-foreground/60'}`}>{item.description}</span>
                  </div>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 opacity-0 transition-all group-hover:opacity-100 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="border-t border-border/80 p-3 bg-zinc-100/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2.5 rounded-lg p-1.5 bg-background border border-border/50 shadow-sm">
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/20">
              GK
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-[11px] font-bold text-foreground truncate">Ganesh Karthick</h4>
              <p className="text-[9px] text-muted-foreground truncate font-medium">Developer Account</p>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" title="System Online" />
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Header navbar */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/80 px-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground border"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Placeholder */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search forms or webhook logs..."
                className="w-full h-9 rounded-lg border border-border bg-muted/40 pl-9 pr-4 text-xs font-medium text-foreground focus:outline-none focus:border-ring transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Notification placeholder */}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative border border-transparent hover:border-border/50">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-5 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
