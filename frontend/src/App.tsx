import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Printer,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
  TrendingUp,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider, useApp } from '@/context/AppContext';
import type { EmployeeItem, AttendanceRecord, LeaveRecord, Role, LeaveType, LeaveBalances } from '@/types';
import {
  employeeApi,
  attendanceApi,
  leaveApi,
  payrollApi,
  reportApi,
  settingApi,
  profileApi,
} from '@/api/services';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

const queryClient = new QueryClient();
const today = new Date();
const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const cn = (...x: (string | false | undefined | null)[]) => x.filter(Boolean).join(' ');

// --- SHARED UI COMPONENTS ---

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#173d38] to-[#24584e] text-sm font-bold text-[#f5eedf] shadow-sm">
        DF
      </div>
      <span className={cn('text-lg font-semibold tracking-[-.03em]', dark ? 'text-[#f4eedf]' : 'text-foreground')}>
        dayflow
      </span>
    </Link>
  );
}

function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'quiet' | 'outline' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm',
        variant === 'quiet' && 'bg-secondary text-secondary-foreground hover:bg-muted',
        variant === 'outline' && 'border border-border bg-card hover:bg-secondary text-foreground',
        variant === 'danger' && 'bg-destructive text-destructive-foreground hover:brightness-110',
        variant === 'ghost' && 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        className
      )}
    >
      {children}
    </button>
  );
}

function Avatar({
  person,
  size = 'md',
}: {
  person?: { initials?: string; color?: string; name?: string };
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const initials = person?.initials || (person?.name ? person.name.slice(0, 2).toUpperCase() : 'DF');
  const bg = person?.color || '#d8bf79';
  return (
    <div
      style={{ background: bg }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold text-[#24322f] select-none shadow-sm',
        size === 'sm' && 'h-8 w-8 text-[11px]',
        size === 'md' && 'h-10 w-10 text-xs',
        size === 'lg' && 'h-16 w-16 text-lg',
        size === 'xl' && 'h-24 w-24 text-2xl font-bold'
      )}
    >
      {initials}
    </div>
  );
}

function Status({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'good' | 'warn' | 'bad' | 'neutral' | 'accent';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide capitalize',
        tone === 'good' && 'bg-[#dbece0] text-[#286147] dark:bg-[#1d4235] dark:text-[#a9d7ba]',
        tone === 'warn' && 'bg-[#f7e9c7] text-[#8a641e] dark:bg-[#4a3a1b] dark:text-[#e6ca83]',
        tone === 'bad' && 'bg-[#f7d9d4] text-[#9b3e35] dark:bg-[#542622] dark:text-[#f1a79e]',
        tone === 'accent' && 'bg-[#e2ebdd] text-[#173d38] dark:bg-[#1d3d34] dark:text-[#c1e2cb]',
        tone === 'neutral' && 'bg-secondary text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          tone === 'good' && 'bg-[#286147] dark:bg-[#a9d7ba]',
          tone === 'warn' && 'bg-[#8a641e] dark:bg-[#e6ca83]',
          tone === 'bad' && 'bg-[#9b3e35] dark:bg-[#f1a79e]',
          tone === 'accent' && 'bg-[#173d38] dark:bg-[#c1e2cb]',
          tone === 'neutral' && 'bg-muted-foreground'
        )}
      />
      {children}
    </span>
  );
}

function Field({ label, ...props }: { label: string; [key: string]: any }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      <input
        {...props}
        className="h-11 rounded-xl border border-input bg-card px-3.5 font-normal text-foreground placeholder:text-muted-foreground transition-colors disabled:bg-muted/40 disabled:cursor-not-allowed"
      />
    </label>
  );
}

function SectionTitle({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mono mb-2 text-[10px] uppercase tracking-[.19em] text-accent-foreground/70">{eyebrow}</p>}
        <h1 className="serif text-4xl tracking-[-.04em] text-foreground md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'lift rounded-2xl border border-card-border p-5 transition-all shadow-sm',
        accent ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <span className={cn('text-xs font-semibold uppercase tracking-[.12em]', accent ? 'text-primary-foreground/65' : 'text-muted-foreground')}>
          {label}
        </span>
        <div className={cn('grid h-8 w-8 place-items-center rounded-lg', accent ? 'bg-primary-foreground/15' : 'bg-secondary')}>
          <Icon size={18} className={accent ? 'text-[#d8bf79]' : 'text-primary dark:text-[#a9d7ba]'} />
        </div>
      </div>
      <div className="text-3xl font-semibold tracking-[-.05em]">{value}</div>
      <p className={cn('mt-1 text-xs', accent ? 'text-primary-foreground/65' : 'text-muted-foreground')}>{detail}</p>
    </div>
  );
}

function StaggeredLetters({ text, delay = 0.5, stagger = 0.08 }: { text: string; delay?: number; stagger?: number }) {
  const letters = Array.from(text);
  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      }}
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] },
            },
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// --- NAVIGATION CONFIG & APPLICATION SHELL ---

const employeeNav = [
  ['/employee/dashboard', 'Overview', LayoutDashboard],
  ['/employee/attendance', 'Attendance', Clock3],
  ['/employee/leave', 'Time away', CalendarDays],
  ['/employee/payroll', 'Payroll', WalletCards],
  ['/employee/profile', 'My profile', UserRound],
] as const;

const adminNav = [
  ['/admin/dashboard', 'Overview', LayoutDashboard],
  ['/admin/employees', 'People', Users],
  ['/admin/attendance', 'Attendance', Clock3],
  ['/admin/leave-approvals', 'Approvals', CheckCircle2],
  ['/admin/payroll', 'Payroll', WalletCards],
  ['/admin/reports', 'Reports & Insights', BarChart3],
  ['/admin/settings', 'Settings', SettingsIcon],
] as const;

function Shell({ children }: { children: ReactNode }) {
  const { user, employee, theme, toggleTheme, signOut, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [location, setLocation] = useLocation();
  const nav = user?.role === 'admin' ? adminNav : employeeNav;
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background lg:flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[265px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-8 px-3">
          <Logo dark />
        </div>
        <div className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-sidebar-foreground/50">
          {user?.role === 'admin' ? 'People Operations' : 'Your Workspace'}
        </div>
        <nav className="grid gap-1">
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                location === href && 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-1 pt-6">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />} {theme === 'light' ? 'Night mode' : 'Day mode'}
          </button>
          <button
            onClick={() => {
              signOut();
              setLocation('/signin');
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
          >
            <LogOut size={17} /> Sign out
          </button>
          <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border pt-4">
            <Avatar person={employee || { initials: user?.name?.slice(0, 2) || 'DF', color: '#d8bf79' }} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{employee?.name || user?.name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">{user?.role === 'admin' ? 'Administrator' : employee?.title || 'Employee'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-foreground/20 lg:hidden backdrop-blur-xs" />}

      {/* Main Content Area */}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/80 px-5 backdrop-blur-md md:px-10">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-secondary lg:hidden">
            <Menu size={20} />
          </button>
          <div className="hidden text-sm font-medium text-muted-foreground md:block">{dateLabel}</div>

          <div className="ml-auto flex items-center gap-3 relative">
            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-card-border bg-card p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">{unreadCount} new</span>}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-primary hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                      {notifications.length ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.isRead) markNotificationRead(n.id);
                              if (n.link) setLocation(n.link);
                              setShowNotifications(false);
                            }}
                            className={cn(
                              'cursor-pointer rounded-xl p-3 text-xs transition-colors',
                              n.isRead ? 'bg-secondary/40 text-muted-foreground' : 'bg-primary/5 border border-primary/20 text-foreground'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground">{n.title}</p>
                              {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                            </div>
                            <p className="mt-1 leading-relaxed">{n.message}</p>
                            <p className="mt-1.5 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))
                      ) : (
                        <p className="py-6 text-center text-xs text-muted-foreground">No notifications at the moment.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href={user?.role === 'admin' ? '/admin/employees' : '/employee/profile'} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-secondary">
              <Avatar person={employee || { initials: user?.name?.slice(0, 2) || 'DF', color: '#d8bf79' }} size="sm" />
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold leading-tight">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user?.role === 'admin' ? 'HR Admin' : 'Employee'}</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="page-in mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}

// --- LANDING PAGE ---

function Landing() {
  return (
    <div className="grain min-h-[100dvh] overflow-hidden bg-[#f2eee5] text-[#1e3935]">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/signin" className="hidden px-4 py-2 text-sm font-semibold md:block hover:text-[#173d38]">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-xl bg-[#173d38] px-4 py-2.5 text-sm font-semibold text-[#f5eedf] transition hover:bg-[#27584f] shadow-sm">
            Start with Dayflow <ArrowRight className="ml-1 inline" size={15} />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1380px] px-6 pb-24 pt-12 md:px-12 md:pt-20">
        <div className="absolute -right-24 -top-16 h-[480px] w-[480px] rounded-full bg-[#d9e4d4] opacity-80 blur-3xl" />
        <div className="relative grid items-end gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-3xl">
            <p className="mono mb-6 text-[11px] uppercase tracking-[.24em] text-[#b55f4c]">A better rhythm for work</p>
            <h1 className="serif max-w-4xl text-[clamp(3.5rem,8vw,7.5rem)] leading-[.88] tracking-[-.07em]">
              <StaggeredLetters text="Workdays," delay={0.2} stagger={0.08} />
              <br />
              <em className="text-[#ba6f5b]">
                <StaggeredLetters text="in flow." delay={0.8} stagger={0.08} />
              </em>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-[#50645d]">
              The calm, considered HRMS workspace for people who make things happen. Streamline employee onboarding, attendance, leave approvals, and payroll visibility.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="inline-flex items-center gap-3 rounded-xl bg-[#173d38] px-5 py-3.5 text-sm font-semibold text-[#f5eedf] shadow-sm hover:bg-[#23534b]">
                Find your flow <ArrowRight size={17} />
              </Link>
              <Link href="/signin" className="inline-flex items-center gap-2 rounded-xl border border-[#173d38]/30 bg-transparent px-5 py-3.5 text-sm font-semibold text-[#173d38] hover:bg-[#173d38]/5">
                Sign in to workspace
              </Link>
            </div>
          </div>

          <div className="relative hidden h-[440px] lg:block">
            <div className="absolute right-10 top-2 w-[400px] rotate-2 rounded-[26px] bg-[#fbf8f1] p-6 shadow-[0_26px_80px_rgba(36,66,57,.18)] border border-[#e8e4db]">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1e3935]">Good morning, Maya 👋</span>
                <span className="h-2.5 w-2.5 rounded-full bg-[#d17f69]" />
              </div>
              <div className="rounded-2xl bg-[#e5eee4] p-5">
                <p className="mono text-[10px] uppercase tracking-widest text-[#678071]">Today · 09:08 AM</p>
                <p className="serif mt-2 text-3xl text-[#173d38]">A clear start.</p>
                <div className="mt-6 flex items-end gap-1.5">
                  <span className="h-12 w-6 rounded-t bg-[#9dbba3]" />
                  <span className="h-20 w-6 rounded-t bg-[#9dbba3]" />
                  <span className="h-16 w-6 rounded-t bg-[#d78e76]" />
                  <span className="h-28 w-6 rounded-t bg-[#173d38]" />
                  <span className="h-24 w-6 rounded-t bg-[#9dbba3]" />
                  <span className="h-32 w-6 rounded-t bg-[#d8bf79]" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <div className="flex-1 rounded-xl border border-[#e4e1d9] bg-white p-3">
                  <span className="text-[11px] text-[#83948b]">Time away</span>
                  <strong className="mt-1 block text-lg text-[#1e3935]">14.5 days</strong>
                </div>
                <div className="flex-1 rounded-xl border border-[#e4e1d9] bg-white p-3">
                  <span className="text-[11px] text-[#83948b]">On time</span>
                  <strong className="mt-1 block text-lg text-[#1e3935]">96.8%</strong>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 flex w-56 -rotate-4 items-center gap-3 rounded-2xl bg-[#d47f68] p-4 text-[#fff7ed] shadow-xl">
              <CheckCircle2 size={24} />
              <div>
                <p className="text-xs opacity-80">Today's Attendance</p>
                <p className="font-semibold">Checked in at 09:08</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-[#173d38] px-6 py-20 text-[#f5eedf] md:px-12">
        <div className="mx-auto grid max-w-[1250px] gap-10 md:grid-cols-3">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d8bf79]">The Dayflow Standard</p>
            <p className="serif mt-4 text-4xl leading-tight">One unified home for human operations.</p>
          </div>
          {[
            ['01', 'Attendance & Time Tracking', 'One-tap check-in, check-out calculations, live weekly views, and accurate working hours logs.'],
            ['02', 'Leave Approval Workflows', 'Seamless leave applications, automatic duration computations, balance tracking, and instant review notes.'],
            ['03', 'Payroll & Analytics', 'Clear salary structure visibility, auto-generated monthly pay slips, salary history logs, and executive reports.'],
          ].map((x) => (
            <div key={x[0]} className="border-t border-[#668077] pt-4">
              <span className="mono text-xs text-[#d8bf79]">{x[0]}</span>
              <h3 className="mt-6 text-lg font-semibold">{x[1]}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#bdd0c3]">{x[2]}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-4 bg-[#f2eee5] px-6 py-10 md:flex-row md:px-12 border-t border-[#e2ddd3]">
        <Logo />
        <p className="text-xs text-[#718078]">© 2025 Dayflow HRMS. “Every workday, perfectly aligned.”</p>
      </footer>
    </div>
  );
}

// --- AUTHENTICATION PAGES ---

function Auth({ mode }: { mode: 'signin' | 'signup' }) {
  const { user, isLoading, signIn, signUp } = useApp();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<Role>('employee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('maya.chen@dayflow.co');
  const [password, setPassword] = useState('Employee@123');
  const [id, setId] = useState('maya.chen@dayflow.co');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');

  useEffect(() => {
    if (!isLoading && user) {
      setLocation(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    }
  }, [user, isLoading, setLocation]);

  const handleRoleSwitch = (r: Role) => {
    setRole(r);
    if (mode === 'signin') {
      if (r === 'admin') {
        setId('admin@dayflow.com');
        setPassword('Admin@123');
      } else {
        setId('maya.chen@dayflow.co');
        setPassword('Employee@123');
      }
    }
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signin') {
      if (!id || !password) {
        setError('Please enter your Employee ID or Email and password.');
        setLoading(false);
        return;
      }
      const res = await signIn(id, password, role);
      if (res.success) {
        setLocation(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      } else {
        setError(res.message || 'Login failed.');
      }
    } else {
      if (!name || !email || password.length < 8) {
        setError('Please provide your full name, valid email, and a password of at least 8 characters.');
        setLoading(false);
        return;
      }
      const res = await signUp(name, email, password, role);
      if (res.success) {
        setLocation(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      } else {
        setError(res.message || 'Signup failed.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[.9fr_1.1fr]">
      {/* Left branding banner */}
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:block">
        <Logo dark />
        <div className="absolute -bottom-24 -left-20 h-96 w-96 rounded-full border border-[#9ab3a3]/30" />
        <div className="absolute left-24 top-1/2 h-64 w-64 rounded-full border border-[#d8bf79]/40" />
        <div className="absolute bottom-14 left-12 right-12">
          <p className="mono text-[10px] uppercase tracking-[.2em] text-[#d8bf79]">The Dayflow principle</p>
          <p className="serif mt-5 max-w-md text-5xl leading-[.95]">A good workday has room for good work.</p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-primary-foreground/65">
            Come for the clarity. Stay for the streamlined workflow that gives your team context and confidence.
          </p>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex flex-col bg-background px-6 py-6 md:px-16">
        <div className="lg:hidden mb-6">
          <Logo />
        </div>
        <div className="mx-auto my-auto w-full max-w-[440px] py-10">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
            ← Back to Dayflow
          </Link>

          <p className="mono text-[10px] uppercase tracking-[.2em] text-accent-foreground/80">
            {mode === 'signin' ? 'Welcome back' : 'Set up your workspace'}
          </p>
          <h1 className="serif mt-2 text-4xl md:text-5xl tracking-[-.05em]">
            {mode === 'signin' ? 'Good to see you.' : 'Make room for better days.'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to access your HRMS dashboard.' : 'Enter your details to create an account.'}
          </p>

          {/* Role selector buttons */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSwitch('employee')}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                role === 'employee' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              )}
            >
              Employee
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all',
                role === 'admin' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              )}
            >
              HR / Admin
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === 'signup' && (
              <Field label="Full name" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Maya Chen" required />
            )}

            <Field
              label={mode === 'signin' ? 'Employee ID or Work Email' : 'Work email'}
              value={mode === 'signin' ? id : email}
              onChange={(e: any) => (mode === 'signin' ? setId(e.target.value) : setEmail(e.target.value))}
              placeholder={role === 'admin' ? 'admin@dayflow.com' : 'maya.chen@dayflow.co'}
              required
            />

            <div>
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {mode === 'signin' && (
                <div className="mt-1 flex justify-end">
                  <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div className="rounded-xl bg-secondary p-3.5 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <ShieldCheck size={16} className="shrink-0 text-primary mt-0.5" />
                  <span>Password requires minimum 8 characters with uppercase, lowercase, number, and special character.</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign in' : 'Create my account'} <ArrowRight size={16} />
            </Button>
          </form>

          {/* Quick Credential Helper in dev mode */}
          <div className="mt-6 rounded-xl border border-dashed border-border p-3 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Demo Accounts:</span>
            <div className="mt-1 flex justify-between">
              <span>Admin: admin@dayflow.com</span>
              <span className="mono">Admin@123</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Employee: maya.chen@dayflow.co</span>
              <span className="mono">Employee@123</span>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? 'New to Dayflow? ' : 'Already have an account? '}
            <Link href={mode === 'signin' ? '/signup' : '/signin'} className="font-semibold text-primary hover:underline">
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-5 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="serif text-2xl">Reset password</h2>
              <button onClick={() => setShowForgot(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            {forgotStep === 'request' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!forgotEmail) return;
                  const res = await authApi.forgotPassword({ email: forgotEmail });
                  if (res.success) {
                    toast.success('Reset code generated. Code: ' + (res.data?.resetToken || '123456'));
                    setForgotStep('reset');
                  }
                }}
                className="mt-5 grid gap-4"
              >
                <p className="text-xs text-muted-foreground">Enter your registered email address to receive a password reset token.</p>
                <Field label="Work email" value={forgotEmail} onChange={(e: any) => setForgotEmail(e.target.value)} placeholder="you@company.com" required />
                <Button type="submit" className="w-full">Generate Reset Token</Button>
              </form>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await authApi.resetPassword({ email: forgotEmail, token: forgotToken, newPassword });
                  if (res.success) {
                    toast.success('Password reset successfully! Please sign in.');
                    setShowForgot(false);
                    setForgotStep('request');
                  } else {
                    toast.error(res.message || 'Reset failed');
                  }
                }}
                className="mt-5 grid gap-4"
              >
                <Field label="Reset Token" value={forgotToken} onChange={(e: any) => setForgotToken(e.target.value)} placeholder="6-digit token" required />
                <Field label="New Password" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="Min 8 characters" required />
                <Button type="submit" className="w-full">Set New Password</Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- EMPLOYEE DASHBOARD ---

function EmployeeDashboard() {
  const { employee, user, todayAttendance, refreshTodayAttendance } = useApp();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [balances, setBalances] = useState<LeaveBalances | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    leaveApi.getMyLeaves().then((res) => {
      if (res.success && res.data) {
        setLeaves(res.data.leaves);
        setBalances(res.data.balances);
      }
    });
  }, []);

  const handleCheckIn = async () => {
    setLoadingAction(true);
    try {
      const res = await attendanceApi.checkIn();
      if (res.success) {
        toast.success(res.message);
        await refreshTodayAttendance();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingAction(true);
    try {
      const res = await attendanceApi.checkOut();
      if (res.success) {
        toast.success(res.message);
        await refreshTodayAttendance();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const isCheckedIn = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;

  return (
    <Shell>
      <SectionTitle
        eyebrow={dateLabel}
        title={`Good morning, ${employee?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'}.`}
        sub="Here is the shape of your workday so far."
        action={
          <div className="flex gap-2">
            <Link href="/employee/attendance">
              <Button variant="outline">
                <Clock3 size={16} /> Attendance Log
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Today's Attendance"
          value={isCheckedOut ? 'Complete' : isCheckedIn ? 'Checked In' : 'Not Checked In'}
          detail={isCheckedIn ? `In at ${todayAttendance.checkIn} ${isCheckedOut ? `· Out: ${todayAttendance.checkOut}` : ''}` : 'Ready for check-in'}
          icon={Clock3}
          accent
        />
        <StatCard
          label="Leave Balance"
          value={`${balances ? balances.paidLeave : '14.5'} days`}
          detail="Paid leave remaining"
          icon={CalendarDays}
        />
        <StatCard
          label="Sick Allowance"
          value={`${balances ? balances.sickLeave : '8'} days`}
          detail="Sick leave available"
          icon={HeartHandshake}
        />
        <StatCard
          label="Current Salary"
          value={`$${((employee?.salary || 94000) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          detail="Monthly gross compensation"
          icon={WalletCards}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Attendance Action & Clock Card */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Workday Rhythm</p>
              <h2 className="serif mt-2 text-3xl">Today's Pulse</h2>
            </div>
            <Status tone={isCheckedOut ? 'good' : isCheckedIn ? 'accent' : 'warn'}>
              {isCheckedOut ? 'Finished' : isCheckedIn ? 'In Office' : 'Pending'}
            </Status>
          </div>

          <div className="mt-8 rounded-2xl bg-secondary/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status summary</p>
                <p className="mt-1 text-lg font-semibold">
                  {isCheckedOut
                    ? `Completed · Total ${todayAttendance.workingHours} hrs`
                    : isCheckedIn
                    ? `Working since ${todayAttendance.checkIn}`
                    : 'Not checked in yet'}
                </p>
              </div>

              <div className="flex gap-2">
                {!isCheckedIn ? (
                  <Button onClick={handleCheckIn} disabled={loadingAction}>
                    <Check size={16} /> Check In Now
                  </Button>
                ) : !isCheckedOut ? (
                  <Button onClick={handleCheckOut} disabled={loadingAction} variant="outline">
                    <LogOut size={16} /> Check Out
                  </Button>
                ) : (
                  <Button disabled variant="quiet">
                    <CheckCircle2 size={16} /> Day Recorded
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-6 gap-2 text-center">
            {['09:00', '11:00', '13:00', '15:00', '17:00', '18:00'].map((time, i) => (
              <div key={time}>
                <div className="flex h-20 items-end justify-center">
                  <div
                    style={{ height: `${[40, 65, 80, 55, 90, 70][i]}%` }}
                    className={cn('w-7 rounded-t-md transition-all', i === 2 ? 'bg-accent' : 'bg-primary/70')}
                  />
                </div>
                <span className="mono mt-2 block text-[10px] text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Recent Requests</p>
            <Link href="/employee/leave" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {leaves.length ? (
              leaves.slice(0, 4).map((l) => (
                <div key={l.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{l.type}</span>
                    <Status tone={l.status === 'approved' ? 'good' : l.status === 'rejected' ? 'bad' : 'warn'}>
                      {l.status}
                    </Status>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {l.start} to {l.end} · {l.days} day{l.days > 1 ? 's' : ''}
                  </p>
                  {l.comment && (
                    <p className="mt-2 rounded-lg bg-secondary/80 p-2 text-[11px] text-muted-foreground">
                      Admin Note: {l.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-secondary/50 p-8 text-center text-xs text-muted-foreground">
                No leave requests filed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// --- EMPLOYEE PROFILE ---

function EmployeeProfile() {
  const { employee, user, refreshProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(employee?.phone || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(employee?.dateOfBirth || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setPhone(employee.phone || '');
      setAddress(employee.address || '');
      setDateOfBirth(employee.dateOfBirth || '');
    }
  }, [employee]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await profileApi.update({ phone, address, dateOfBirth });
      if (res.success) {
        toast.success('Profile updated successfully');
        await refreshProfile();
        setEditing(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhotoMock = async () => {
    const colors = ['#e58f78', '#9eb9a8', '#b7a0c9', '#d8b36a', '#84a7bb', '#c9949d'];
    const chosen = colors[Math.floor(Math.random() * colors.length)];
    await profileApi.update({ profilePicture: chosen });
    await refreshProfile();
    toast.success('Profile picture updated!');
  };

  return (
    <Shell>
      <SectionTitle
        eyebrow="Personal Record"
        title="My Profile"
        sub="Your verified details, employment record, and compensation."
        action={
          <Button
            onClick={() => (editing ? saveChanges() : setEditing(true))}
            disabled={saving}
            variant={editing ? 'primary' : 'outline'}
          >
            {editing ? (
              <>
                <Check size={16} /> Save Changes
              </>
            ) : (
              <>
                <Pencil size={16} /> Edit Contact Info
              </>
            )}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        {/* Profile Card */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Avatar person={employee || { initials: user?.name?.slice(0, 2) || 'DF', color: '#d8bf79' }} size="xl" />
            <h2 className="mt-4 text-xl font-semibold">{employee?.name || user?.name}</h2>
            <p className="text-sm text-muted-foreground">{employee?.title || 'Team Member'}</p>
            <div className="mt-3">
              <Status tone="good">Active Employee</Status>
            </div>
            <button onClick={uploadPhotoMock} className="mt-4 text-xs font-semibold text-primary hover:underline">
              Change Avatar Color
            </button>
          </div>

          <div className="mt-8 space-y-4 border-t border-border pt-6 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail size={16} className="shrink-0 text-primary" />
              <span className="truncate">{employee?.email || user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone size={16} className="shrink-0 text-primary" />
              <span>{employee?.phone || 'No phone added'}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <BriefcaseBusiness size={16} className="shrink-0 text-primary" />
              <span>Joined {employee?.joined || '2023'}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Building2 size={16} className="shrink-0 text-primary" />
              <span>{employee?.department || 'General'} Department</span>
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg">Contact & Personal Details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Employees can update phone, home address, and date of birth.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                label="Phone number"
                value={phone}
                disabled={!editing}
                onChange={(e: any) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              <Field
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                disabled={!editing}
                onChange={(e: any) => setDateOfBirth(e.target.value)}
              />
              <div className="md:col-span-2">
                <Field
                  label="Home address"
                  value={address}
                  disabled={!editing}
                  onChange={(e: any) => setAddress(e.target.value)}
                  placeholder="Street Address, City, State, ZIP"
                />
              </div>
            </div>
          </div>

          {/* Job & Compensation Details */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Job & Compensation Structure</h3>
                <p className="mt-1 text-sm text-muted-foreground">Verified role information managed by People Operations.</p>
              </div>
              <WalletCards size={22} className="text-primary" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-secondary/50 p-3.5">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="mt-1 font-semibold text-foreground">{employee?.department || 'Design'}</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3.5">
                <p className="text-xs text-muted-foreground">Work Location</p>
                <p className="mt-1 font-semibold text-foreground">{employee?.location || 'San Francisco'}</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3.5">
                <p className="text-xs text-muted-foreground">Annual Base</p>
                <p className="mt-1 font-semibold text-foreground">${(employee?.salary || 94000).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Employment Documents */}
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Employment Documents</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Secure documents on file.</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  <span>Employment_Agreement_Dayflow.pdf</span>
                </div>
                <button
                  onClick={() => toast.info('Previewing Employment Agreement')}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// --- EMPLOYEE ATTENDANCE PAGE ---

function AttendancePage() {
  const { todayAttendance, refreshTodayAttendance } = useApp();
  const [now, setNow] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadAttendance = async () => {
    try {
      const res = await attendanceApi.getMyAttendance();
      if (res.success && res.data) {
        setRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      if (res.success) {
        toast.success(res.message);
        await Promise.all([refreshTodayAttendance(), loadAttendance()]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      if (res.success) {
        toast.success(res.message);
        await Promise.all([refreshTodayAttendance(), loadAttendance()]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;

  return (
    <Shell>
      <SectionTitle
        eyebrow="Personal Attendance"
        title="Your Time, in View."
        sub="Keep your day moving with a simple, accurate record."
      />

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        {/* Live Clock Card */}
        <div className="rounded-2xl bg-primary p-7 text-primary-foreground shadow-md flex flex-col justify-between">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/60">Live Clock</p>
            <p className="serif mt-4 text-6xl tracking-[-.06em]">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="mt-2 text-sm text-primary-foreground/70">{dateLabel}</p>
          </div>

          <div className="mt-10 border-t border-primary-foreground/15 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-foreground/60">Started at</p>
                <p className="mt-1 text-lg font-semibold">{todayAttendance?.checkIn || '—'}</p>
              </div>

              {!isCheckedIn ? (
                <Button onClick={handleCheckIn} disabled={loading} variant="quiet" className="bg-[#d8bf79] text-primary font-bold">
                  Check In <ArrowRight size={15} />
                </Button>
              ) : !isCheckedOut ? (
                <Button onClick={handleCheckOut} disabled={loading} variant="quiet" className="bg-[#d8bf79] text-primary font-bold">
                  Check Out <ArrowRight size={15} />
                </Button>
              ) : (
                <span className="rounded-xl bg-primary-foreground/20 px-4 py-2 text-xs font-semibold">
                  Complete ({todayAttendance.workingHours} hrs)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="rounded-2xl border border-card-border bg-card p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">This Week</p>
              <h2 className="serif mt-2 text-3xl">Steady Progress.</h2>
            </div>
            <Status tone="good">96.8% on time</Status>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center">
                <span className="mono text-[10px] text-muted-foreground">{d}</span>
                <div className={cn('mx-auto mt-3 h-24 w-full max-w-[34px] rounded-full p-1', i < 5 ? 'bg-[#d8e7d7] dark:bg-[#23493d]' : 'bg-secondary')}>
                  <div
                    className={cn('h-full rounded-full transition-all', i === 2 ? 'bg-accent' : 'bg-primary/70')}
                    style={{ height: i < 5 ? `${[88, 94, 76, 100, 82][i]}%` : '0%' }}
                  />
                </div>
                <span className="mt-2 block text-[10px] text-muted-foreground">{i < 5 ? ['8h 15', '8h 30', '7h 45', '8h 20', '7h 50'][i] : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Attendance History */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h3 className="font-semibold text-base">Daily Attendance Log</h3>
          <span className="text-xs text-muted-foreground">{records.length} records on file</span>
        </div>

        <div className="divide-y divide-border">
          {records.length ? (
            records.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                    <Clock3 size={17} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{a.date === new Date().toISOString().slice(0, 10) ? 'Today' : a.date}</p>
                    <p className="text-xs text-muted-foreground">
                      In: {a.checkIn || '—'} · Out: {a.checkOut || 'In progress'} {a.workingHours ? `(${a.workingHours} hrs)` : ''}
                    </p>
                  </div>
                </div>

                <Status tone={a.status === 'late' ? 'warn' : a.status === 'absent' ? 'bad' : a.status === 'remote' ? 'accent' : 'good'}>
                  {a.status}
                </Status>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">No attendance history available.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}

// --- EMPLOYEE LEAVE PAGE ---

function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [balances, setBalances] = useState<LeaveBalances | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeaveType>('Paid leave');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLeaves = async () => {
    try {
      const res = await leaveApi.getMyLeaves();
      if (res.success && res.data) {
        setLeaves(res.data.leaves);
        setBalances(res.data.balances);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const calculateDays = () => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const submit = async (e: any) => {
    e.preventDefault();
    if (!start || !end || !remarks) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await leaveApi.apply({
        leaveType: type,
        startDate: start,
        endDate: end,
        remarks,
      });
      if (res.success) {
        toast.success('Leave application submitted for approval.');
        setOpen(false);
        setStart('');
        setEnd('');
        setRemarks('');
        await loadLeaves();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <SectionTitle
        eyebrow="Time Away"
        title="Make Space."
        sub="Plans change. Your time away should be seamless to manage and track."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={17} /> Request Time Away
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Paid leave"
          value={`${balances ? balances.paidLeave : 17} days`}
          detail="available balance this year"
          icon={CalendarDays}
        />
        <StatCard
          label="Sick leave"
          value={`${balances ? balances.sickLeave : 9} days`}
          detail="available allowance"
          icon={HeartHandshake}
        />
        <StatCard
          label="Requests"
          value={`${leaves.length}`}
          detail="in your timeline"
          icon={FileText}
          accent
        />
      </div>

      {/* Leave Application Modal / Form */}
      {open && (
        <div className="mt-6 rounded-2xl border border-primary/40 bg-card p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Request Time Away</h3>
              <p className="text-xs text-muted-foreground">Your manager and People Ops will be notified for review.</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Leave Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-normal"
              >
                <option>Paid leave</option>
                <option>Sick leave</option>
                <option>Unpaid leave</option>
              </select>
            </label>

            <Field label="Start Date" type="date" value={start} onChange={(e: any) => setStart(e.target.value)} required />
            <Field label="End Date" type="date" value={end} onChange={(e: any) => setEnd(e.target.value)} required />

            <div className="md:col-span-3">
              <Field
                label="Reason / Remarks"
                value={remarks}
                onChange={(e: any) => setRemarks(e.target.value)}
                placeholder="Brief context for your absence..."
                required
              />
            </div>

            {start && end && (
              <div className="md:col-span-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 size={14} /> Total Duration: <strong>{calculateDays()} working day(s)</strong>
              </div>
            )}

            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Send Request'} <ArrowRight size={16} />
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Timeline */}
      <div className="mt-8 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg">Request Timeline</h3>
        <div className="mt-6 space-y-6">
          {leaves.length ? (
            leaves.map((l, i) => (
              <div key={l.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      'z-10 grid h-10 w-10 place-items-center rounded-full shadow-xs',
                      l.status === 'approved' ? 'bg-[#dbece0] text-[#286147]' : l.status === 'rejected' ? 'bg-[#f7d9d4] text-[#9b3e35]' : 'bg-[#f7e9c7] text-[#8a641e]'
                    )}
                  >
                    {l.status === 'approved' ? <Check size={18} /> : l.status === 'rejected' ? <X size={18} /> : <Clock3 size={18} />}
                  </div>
                  {i < leaves.length - 1 && <div className="absolute top-10 h-full w-px bg-border" />}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-base">
                      {l.type} <span className="font-normal text-muted-foreground text-sm">· {l.days} day{l.days > 1 ? 's' : ''}</span>
                    </p>
                    <Status tone={l.status === 'approved' ? 'good' : l.status === 'rejected' ? 'bad' : 'warn'}>
                      {l.status}
                    </Status>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {l.start} — {l.end}
                  </p>
                  <p className="mt-2 text-sm text-foreground bg-secondary/30 p-3 rounded-xl">“{l.reason}”</p>
                  {l.comment && (
                    <p className="mt-2 rounded-xl bg-secondary/80 p-3 text-xs text-muted-foreground">
                      <strong>Review Note:</strong> {l.comment}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
              No leave requests filed yet. Your next request will appear here.
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// --- EMPLOYEE PAYROLL PAGE ---

function PayrollPage() {
  const [data, setData] = useState<any>(null);
  const [showSlip, setShowSlip] = useState(false);

  useEffect(() => {
    payrollApi.getMyPayroll().then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  }, []);

  const printSlip = () => {
    window.print();
  };

  const monthlyNet = data?.salaryStructure?.monthlyNet || 6500;
  const basicSalary = data?.salaryStructure?.basicSalary || 94000;
  const allowances = data?.salaryStructure?.allowances || 6000;
  const deductions = data?.salaryStructure?.deductions || 14000;

  return (
    <Shell>
      <SectionTitle
        eyebrow="Compensation"
        title="Your Pay, Clearly."
        sub="A read-only view of your current salary structure and monthly take-home."
        action={
          <Button onClick={() => setShowSlip(true)}>
            <FileText size={16} /> View Pay Slip
          </Button>
        }
      />

      <div className="rounded-2xl bg-primary p-7 text-primary-foreground shadow-md md:p-9">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/60">Estimated Monthly Net</p>
            <p className="serif mt-3 text-5xl md:text-6xl tracking-[-.06em]">
              ${monthlyNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-2 text-sm text-primary-foreground/70">Disbursed on the last working day of each calendar month</p>
          </div>
          <WalletCards size={50} className="text-[#d8bf79]" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg">Annual Salary Structure</h3>
          <div className="mt-5 divide-y divide-border text-sm">
            {[
              ['Annual Base Salary', `$${basicSalary.toLocaleString()}`],
              ['Total Allowances (HRA & Special)', `$${allowances.toLocaleString()}`],
              ['Annual Gross Compensation', `$${(basicSalary + allowances).toLocaleString()}`],
              ['Statutory Deductions & Taxes', `-$${deductions.toLocaleString()}`],
              ['Net Annual Disbursal', `$${(basicSalary + allowances - deductions).toLocaleString()}`],
            ].map((x) => (
              <div key={x[0]} className="flex justify-between py-3">
                <span className="text-muted-foreground">{x[0]}</span>
                <span className="font-semibold text-foreground">{x[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg">Monthly Breakdown</h3>
          <div className="mt-6 space-y-5">
            {[
              ['Monthly Gross Pay', (basicSalary + allowances) / 12, 'bg-primary'],
              ['Tax & Deductions', deductions / 12, 'bg-accent'],
              ['Net Take-Home', monthlyNet, 'bg-[#7ca886]'],
            ].map((x: any) => (
              <div key={x[0]} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{x[0]}</span>
                  <span className="font-semibold">${Number(x[1]).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={cn('h-full rounded-full', x[2])} style={{ width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {showSlip && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-card-border bg-card p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <Logo />
              <div className="flex gap-2">
                <Button onClick={printSlip} variant="outline">
                  <Printer size={15} /> Print Slip
                </Button>
                <button onClick={() => setShowSlip(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="serif text-2xl font-bold text-[#173d38] dark:text-[#a9d7ba]">DAYFLOW SALARY SLIP</h2>
              <p className="text-xs text-muted-foreground mt-1">Official Payment Advice · {dateLabel}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-secondary/50 p-4 text-xs">
              <div>
                <p className="text-muted-foreground">Employee Name</p>
                <p className="font-semibold text-sm">{data?.employee?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Employee ID</p>
                <p className="font-semibold text-sm">{data?.employee?.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-semibold text-sm">{data?.employee?.department}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Designation</p>
                <p className="font-semibold text-sm">{data?.employee?.designation}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Earnings</h4>
                <div className="mt-3 space-y-2 text-sm">
                  {data?.slip?.earnings.map((e: any) => (
                    <div key={e.label} className="flex justify-between">
                      <span className="text-muted-foreground">{e.label}</span>
                      <span className="font-semibold">${Number(e.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Gross Earnings</span>
                    <span>${Number(data?.slip?.grossTotal).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Deductions</h4>
                <div className="mt-3 space-y-2 text-sm">
                  {data?.slip?.deductions.map((d: any) => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="font-semibold">${Number(d.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total Deductions</span>
                    <span>${Number(data?.slip?.deductionsTotal).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-primary p-4 text-primary-foreground flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-foreground/70 uppercase tracking-wider">Net Amount Disbursed</p>
                <p className="serif text-3xl font-bold mt-0.5">${Number(data?.slip?.netPay).toLocaleString()}</p>
              </div>
              <CheckCircle2 size={32} className="text-[#d8bf79]" />
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

// --- ADMIN DASHBOARD ---

function AdminDashboard() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [attendanceReport, setAttendanceReport] = useState<any>(null);
  const [payrollReport, setPayrollReport] = useState<any>(null);

  useEffect(() => {
    employeeApi.getAll().then((res) => res.success && setEmployees(res.data.employees));
    leaveApi.getAllLeaves({ status: 'pending' }).then((res) => res.success && setLeaves(res.data.leaves));
    reportApi.getAttendanceReport().then((res) => res.success && setAttendanceReport(res.data));
    reportApi.getPayrollReport().then((res) => res.success && setPayrollReport(res.data));
  }, []);

  const presentCount = attendanceReport?.summary?.present || 8;
  const totalEmployees = employees.length || 7;
  const pendingCount = leaves.length;
  const annualPayroll = payrollReport?.summary?.totalAnnualPayroll || 780000;

  const handleInlineApprove = async (id: string) => {
    try {
      const res = await leaveApi.approve(id);
      if (res.success) {
        toast.success('Leave request approved');
        setLeaves((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      toast.error('Failed to approve');
    }
  };

  return (
    <Shell>
      <SectionTitle
        eyebrow={`People Operations · ${dateLabel}`}
        title="The Bigger Picture."
        sub="A considered, live view of your entire organization today."
        action={
          <Link href="/admin/reports">
            <Button variant="outline">
              <Download size={16} /> Reports & Analytics
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team size" value={`${totalEmployees}`} detail="active workforce" icon={Users} accent />
        <StatCard
          label="Present today"
          value={`${presentCount} / ${totalEmployees}`}
          detail={`${Math.round((presentCount / (totalEmployees || 1)) * 100)}% attendance rate`}
          icon={CheckCircle2}
        />
        <StatCard label="Time away" value={`${pendingCount}`} detail="pending reviews" icon={CalendarDays} />
        <StatCard
          label="Annual payroll"
          value={`$${(annualPayroll / 1000000).toFixed(2)}m`}
          detail="budgeted total base"
          icon={WalletCards}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Workforce Pulse Chart */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Workforce Pulse</p>
              <h2 className="serif mt-2 text-3xl">Attendance Rhythm</h2>
            </div>
            <BarChart3 className="text-primary" />
          </div>

          <div className="mt-6 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceReport?.trend || [
                { dayLabel: 'Mon', rate: 85 },
                { dayLabel: 'Tue', rate: 92 },
                { dayLabel: 'Wed', rate: 90 },
                { dayLabel: 'Thu', rate: 96 },
                { dayLabel: 'Fri', rate: 88 },
              ]}>
                <defs>
                  <linearGradient id="rateColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#173d38" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#173d38" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="dayLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[60, 100]} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="rate" stroke="#173d38" strokeWidth={2.5} fillOpacity={1} fill="url(#rateColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals Quick Queue */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Needs Attention</p>
              <Link href="/admin/leave-approvals" className="text-xs font-semibold text-primary hover:underline">
                Open Inbox ({pendingCount})
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {leaves.length ? (
                leaves.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.type} · {l.days} day{l.days > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleInlineApprove(l.id)}
                        className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 size={24} className="mx-auto text-primary mb-2" />
                  All caught up. No pending requests.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Quick Switcher */}
      <div className="mt-6 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-base">Active Team Members</h3>
          <Link href="/admin/employees" className="text-xs font-semibold text-primary hover:underline">
            Manage People ({employees.length}) <ArrowRight className="ml-1 inline" size={13} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {employees.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/40 transition-colors">
              <Avatar person={e} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.name}</p>
                <p className="truncate text-xs text-muted-foreground">{e.department}</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#7ca886]" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// --- ADMIN EMPLOYEES MANAGEMENT ---

function AdminEmployees() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [selected, setSelected] = useState<EmployeeItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<EmployeeItem>>({});
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    basicSalary: 95000,
    allowances: 5000,
    deductions: 12000,
    location: 'Office',
    role: 'employee' as Role,
  });

  const loadEmployees = async () => {
    try {
      const res = await employeeApi.getAll({ search: query, department: departmentFilter });
      if (res.success && res.data) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [query, departmentFilter]);

  const handleCreateEmployee = async (e: any) => {
    e.preventDefault();
    try {
      const res = await employeeApi.create(newEmployee);
      if (res.success) {
        toast.success('Employee successfully added!');
        setIsAddOpen(false);
        setNewEmployee({
          name: '',
          email: '',
          department: 'Engineering',
          designation: 'Software Engineer',
          basicSalary: 95000,
          allowances: 5000,
          deductions: 12000,
          location: 'Office',
          role: 'employee',
        });
        await loadEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selected) return;
    try {
      const res = await employeeApi.update(selected.id, draft);
      if (res.success) {
        toast.success('Employee updated successfully');
        setSelected(null);
        await loadEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate/remove this employee?')) return;
    try {
      const res = await employeeApi.delete(id);
      if (res.success) {
        toast.success('Employee removed');
        await loadEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const departments = ['All departments', 'Engineering', 'Design', 'Marketing', 'People', 'Support', 'Finance', 'Product', 'Insights'];

  return (
    <Shell>
      <SectionTitle
        eyebrow="People Operations"
        title="Team Directory"
        sub={`${employees.length} employees making Dayflow happen.`}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={17} /> Add New Employee
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-3.5 text-muted-foreground" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, role, email, or employee ID..."
            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm focus:border-primary"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="h-11 rounded-xl border border-input bg-card px-4 text-sm font-semibold"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground md:grid">
          <span>Employee</span>
          <span>Role & Dept</span>
          <span>Location</span>
          <span>Compensation</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-border">
          {employees.map((e) => (
            <div key={e.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-6 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar person={e} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.email} · <span className="mono">{e.id}</span></p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.department}</p>
              </div>

              <div className="text-sm text-muted-foreground">{e.location}</div>

              <div className="text-sm font-semibold">${e.salary?.toLocaleString()} / yr</div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelected(e);
                    setDraft(e);
                  }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDeleteEmployee(e.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-5 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="serif text-2xl">Onboard New Employee</h2>
                <p className="text-xs text-muted-foreground">Creates full user credentials and salary package.</p>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-5 grid gap-4">
              <Field label="Full Name" value={newEmployee.name} onChange={(e: any) => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="Alex Rivera" required />
              <Field label="Work Email" type="email" value={newEmployee.email} onChange={(e: any) => setNewEmployee({ ...newEmployee, email: e.target.value })} placeholder="alex@dayflow.co" required />
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Department
                  <select
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="h-11 rounded-xl border border-input bg-card px-3 text-sm"
                  >
                    {departments.filter((d) => d !== 'All departments').map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <Field label="Job Designation" value={newEmployee.designation} onChange={(e: any) => setNewEmployee({ ...newEmployee, designation: e.target.value })} required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Basic Salary" type="number" value={newEmployee.basicSalary} onChange={(e: any) => setNewEmployee({ ...newEmployee, basicSalary: Number(e.target.value) })} required />
                <Field label="Allowances" type="number" value={newEmployee.allowances} onChange={(e: any) => setNewEmployee({ ...newEmployee, allowances: Number(e.target.value) })} />
                <Field label="Deductions" type="number" value={newEmployee.deductions} onChange={(e: any) => setNewEmployee({ ...newEmployee, deductions: Number(e.target.value) })} />
              </div>

              <Field label="Office / Work Location" value={newEmployee.location} onChange={(e: any) => setNewEmployee({ ...newEmployee, location: e.target.value })} />

              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit">Create Employee Record</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-5 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="serif text-2xl">Edit Employee Record</h2>
                <p className="text-xs text-muted-foreground">{selected.name} · {selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Job Title" value={draft.title || ''} onChange={(e: any) => setDraft({ ...draft, title: e.target.value })} />
              <Field label="Department" value={draft.department || ''} onChange={(e: any) => setDraft({ ...draft, department: e.target.value })} />
              <Field label="Annual Base Salary ($)" type="number" value={draft.salary || 0} onChange={(e: any) => setDraft({ ...draft, salary: Number(e.target.value), basicSalary: Number(e.target.value) })} />
              <Field label="Work Location" value={draft.location || ''} onChange={(e: any) => setDraft({ ...draft, location: e.target.value })} />

              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={handleUpdateEmployee}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

// --- ADMIN ATTENDANCE PAGE ---

function AdminAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAttendance = async () => {
    try {
      const res = await attendanceApi.getAllAttendance({ search: query, status: statusFilter });
      if (res.success && res.data) {
        setRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [query, statusFilter]);

  const exportCSV = () => {
    const header = 'Employee ID,Name,Department,Date,Check In,Check Out,Hours,Status\n';
    const rows = records
      .map((r) => `"${r.employeeId}","${r.name || ''}","${r.department || ''}","${r.date}","${r.checkIn || ''}","${r.checkOut || ''}","${r.workingHours}","${r.status}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dayflow_Attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Attendance CSV exported!');
  };

  const presentCount = records.filter((r) => ['present', 'remote'].includes(r.status)).length;
  const lateCount = records.filter((r) => r.status === 'late').length;

  return (
    <Shell>
      <SectionTitle
        eyebrow="People Operations"
        title="Attendance, Together."
        sub="The live view of today's rhythm across all departments."
        action={
          <Button onClick={exportCSV} variant="outline">
            <Download size={16} /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Present in Office" value={`${presentCount}`} detail="active attendance today" icon={CheckCircle2} accent />
        <StatCard label="Late Starts" value={`${lateCount}`} detail="arrived past 09:30 AM" icon={Clock3} />
        <StatCard label="Total Logged" value={`${records.length}`} detail="records matching filter" icon={Users} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-3.5 text-muted-foreground" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee name or ID..."
            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-xl border border-input bg-card px-4 text-sm font-semibold"
        >
          <option value="all">All statuses</option>
          <option value="present">Present</option>
          <option value="remote">Remote</option>
          <option value="late">Late</option>
          <option value="half_day">Half-day</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="divide-y divide-border">
          {records.map((a) => (
            <div key={a.id} className="grid gap-3 px-6 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center">
              <div className="flex items-center gap-3">
                <Avatar person={{ initials: a.initials, color: a.color }} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.department} · {a.employeeId}</p>
                </div>
              </div>

              <span className="text-sm text-muted-foreground">
                In: <strong className="ml-1 text-foreground">{a.checkIn || '—'}</strong>
              </span>

              <span className="text-sm text-muted-foreground">
                Out: <strong className="ml-1 text-foreground">{a.checkOut || '—'}</strong>
              </span>

              <div className="flex justify-end">
                <Status tone={a.status === 'late' ? 'warn' : a.status === 'absent' ? 'bad' : a.status === 'remote' ? 'accent' : 'good'}>
                  {a.status}
                </Status>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// --- ADMIN LEAVE APPROVALS PAGE ---

function AdminApprovals() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [comments, setComments] = useState<Record<string, string>>({});

  const loadLeaves = async () => {
    try {
      const res = await leaveApi.getAllLeaves();
      if (res.success && res.data) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await leaveApi.approve(id, comments[id] || 'Approved by HR Operations');
      if (res.success) {
        toast.success('Leave request approved');
        await loadLeaves();
      }
    } catch {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectComment.trim()) {
      toast.error('Please provide a rejection reason/comment.');
      return;
    }
    try {
      const res = await leaveApi.reject(rejectingId, rejectComment.trim());
      if (res.success) {
        toast.success('Leave request rejected');
        setRejectingId(null);
        setRejectComment('');
        await loadLeaves();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject leave');
    }
  };

  const pending = leaves.filter((l) => l.status === 'pending');
  const reviewed = leaves.filter((l) => l.status !== 'pending');

  return (
    <Shell>
      <SectionTitle
        eyebrow="People Operations"
        title="Leave Inbox"
        sub="Review time away requests and keep your workforce supported."
        action={<span className="rounded-full bg-[#f7e9c7] px-3 py-1.5 text-xs font-semibold text-[#8a641e]">{pending.length} waiting</span>}
      />

      {pending.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card py-20 text-center shadow-xs">
          <CheckCircle2 size={36} className="text-primary" />
          <h2 className="serif mt-4 text-3xl">All caught up.</h2>
          <p className="mt-2 text-sm text-muted-foreground">No pending requests need your attention right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((l) => (
            <div key={l.id} className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div className="flex items-center gap-3">
                  <Avatar person={{ initials: l.initials, color: l.color }} size="md" />
                  <div>
                    <p className="font-semibold text-base">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.title} · {l.department} · {l.employeeId}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setRejectingId(l.id)} variant="outline" className="text-destructive hover:bg-destructive/10">
                    <XCircle size={16} /> Reject
                  </Button>
                  <Button onClick={() => handleApprove(l.id)}>
                    <Check size={16} /> Approve
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 rounded-xl bg-secondary/50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Leave Type</p>
                  <p className="mt-1 text-sm font-semibold">{l.type}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Dates</p>
                  <p className="mt-1 text-sm font-semibold">{l.start} to {l.end}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Duration</p>
                  <p className="mt-1 text-sm font-semibold">{l.days} day{l.days > 1 ? 's' : ''}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-foreground bg-secondary/30 p-3 rounded-xl">“{l.reason}”</p>

              <input
                value={comments[l.id] || ''}
                onChange={(e) => setComments({ ...comments, [l.id]: e.target.value })}
                placeholder="Optional approval note for employee..."
                className="mt-4 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-5 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
            <h3 className="serif text-2xl font-bold">Reject Leave Request</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Please explain why this request cannot be approved so the employee is informed.
            </p>
            <div className="mt-4">
              <Field
                label="Rejection Reason"
                value={rejectComment}
                onChange={(e: any) => setRejectComment(e.target.value)}
                placeholder="e.g. Critical sprint deadline during requested dates..."
                required
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleReject}>Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-10 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-base">Recently Reviewed Leaves</h3>
        <div className="mt-4 divide-y divide-border">
          {reviewed.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold">{l.name} <span className="text-muted-foreground font-normal">· {l.type} ({l.days}d)</span></p>
                <p className="text-xs text-muted-foreground">{l.start} to {l.end} {l.comment ? `· "${l.comment}"` : ''}</p>
              </div>
              <Status tone={l.status === 'approved' ? 'good' : 'bad'}>{l.status}</Status>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// --- ADMIN PAYROLL PAGE ---

function AdminPayroll() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBasic, setDraftBasic] = useState(0);
  const [draftAllow, setDraftAllow] = useState(0);
  const [draftDeduct, setDraftDeduct] = useState(0);
  const [reason, setReason] = useState('');

  const loadPayroll = async () => {
    try {
      const res = await payrollApi.getAllPayroll();
      if (res.success && res.data) {
        setPayrolls(res.data.payrolls);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const handleSave = async (empId: string) => {
    try {
      const res = await payrollApi.updateSalary(empId, {
        basicSalary: draftBasic,
        allowances: draftAllow,
        deductions: draftDeduct,
        changeReason: reason || 'Admin salary structure update',
      });
      if (res.success) {
        toast.success('Salary updated successfully');
        setEditingId(null);
        await loadPayroll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update salary');
    }
  };

  const exportCSV = () => {
    const header = 'Employee ID,Name,Department,Basic Salary,Allowances,Deductions,Net Salary,Monthly Gross\n';
    const rows = payrolls
      .map((p) => `"${p.id}","${p.name}","${p.department}","${p.basicSalary}","${p.allowances}","${p.deductions}","${p.netSalary}","${p.monthlyGross.toFixed(2)}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dayflow_Payroll_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Payroll CSV exported!');
  };

  return (
    <Shell>
      <SectionTitle
        eyebrow="People Operations"
        title="Compensation, in Order."
        sub="Maintain salary structures, audit compensation adjustments, and view total spend."
        action={
          <Button onClick={exportCSV} variant="outline">
            <Download size={16} /> Export Payroll CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Annual Base"
          value={`$${((summary?.totalAnnualPayroll || 780000) / 1000).toFixed(0)}k`}
          detail={`across ${payrolls.length} employees`}
          icon={WalletCards}
          accent
        />
        <StatCard
          label="Monthly Disbursal"
          value={`$${((summary?.totalMonthlyNet || 55000) / 1000).toFixed(1)}k`}
          detail="net payroll cost"
          icon={BarChart3}
        />
        <StatCard label="Next Pay Date" value="End of Month" detail="Last business day" icon={CalendarDays} />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground md:grid">
          <span>Employee</span>
          <span>Department</span>
          <span>Basic / Allowances</span>
          <span>Net Take-Home</span>
          <span>Action</span>
        </div>

        <div className="divide-y divide-border">
          {payrolls.map((p) => (
            <div key={p.id} className="grid gap-3 px-6 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
              <div className="flex items-center gap-3">
                <Avatar person={p} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.title} · {p.id}</p>
                </div>
              </div>

              <span className="text-sm text-muted-foreground">{p.department}</span>

              {editingId === p.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={draftBasic}
                    onChange={(e) => setDraftBasic(Number(e.target.value))}
                    className="h-9 w-24 rounded-lg border border-primary bg-card px-2 text-xs font-semibold"
                    placeholder="Basic"
                  />
                  <input
                    type="number"
                    value={draftAllow}
                    onChange={(e) => setDraftAllow(Number(e.target.value))}
                    className="h-9 w-20 rounded-lg border border-primary bg-card px-2 text-xs font-semibold"
                    placeholder="Allow"
                  />
                </div>
              ) : (
                <div>
                  <span className="text-sm font-semibold">${p.basicSalary.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">(+${p.allowances})</span>
                </div>
              )}

              <span className="text-sm font-bold text-primary dark:text-[#a9d7ba]">
                ${(p.netSalary / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / mo
              </span>

              {editingId === p.id ? (
                <div className="flex gap-1">
                  <button onClick={() => handleSave(p.id)} className="rounded-lg bg-primary p-2 text-primary-foreground">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg bg-secondary p-2 text-muted-foreground">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setDraftBasic(p.basicSalary);
                    setDraftAllow(p.allowances);
                    setDraftDeduct(p.deductions);
                  }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// --- ADMIN REPORTS & ANALYTICS PAGE ---

function AdminReports() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [tab, setTab] = useState<'attendance' | 'leave' | 'payroll'>('attendance');

  useEffect(() => {
    reportApi.getAnalytics().then((res) => res.success && setAnalytics(res.data));
  }, []);

  return (
    <Shell>
      <SectionTitle
        eyebrow="Reports & Insights"
        title="Human Capital Analytics."
        sub="Live organizational data, attendance distributions, leave quotas, and compensation models."
      />

      <div className="mb-6 flex gap-2 border-b border-border pb-4">
        {(['attendance', 'leave', 'payroll'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-semibold capitalize transition-all',
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            {t} Report
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Breakdown */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-base">Department Employee Distribution</h3>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.departmentDistribution || [
                { name: 'Engineering', count: 3 },
                { name: 'Design', count: 2 },
                { name: 'Marketing', count: 2 },
                { name: 'People', count: 1 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#173d38" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Type Ratio */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-base">Leave Distribution by Category</h3>
          <div className="mt-6 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.leaveTypes || [
                    { name: 'Paid Leave', value: 12 },
                    { name: 'Sick Leave', value: 4 },
                    { name: 'Unpaid Leave', value: 2 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#173d38" />
                  <Cell fill="#d47f68" />
                  <Cell fill="#d8bf79" />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// --- ADMIN SETTINGS PAGE ---

function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    organizationName: 'Dayflow Inc.',
    officialEmail: 'operations@dayflow.com',
    workHoursStart: '09:00',
    workHoursEnd: '17:30',
    paidLeaveAllowance: '20',
    sickLeaveAllowance: '10',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingApi.get().then((res) => {
      if (res.success && res.data) {
        setSettings(res.data);
      }
    });
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }));
      const res = await settingApi.update(payload);
      if (res.success) {
        toast.success('Organization settings saved successfully!');
      }
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <SectionTitle
        eyebrow="System Configuration"
        title="Admin Settings"
        sub="Configure organization policies, standard working hours, and leave quotas."
      />

      <form onSubmit={handleSave} className="max-w-2xl rounded-2xl border border-card-border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold text-lg">Organization Profile</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Company Name"
              value={settings.organizationName || ''}
              onChange={(e: any) => setSettings({ ...settings, organizationName: e.target.value })}
            />
            <Field
              label="Official HR Email"
              type="email"
              value={settings.officialEmail || ''}
              onChange={(e: any) => setSettings({ ...settings, officialEmail: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-lg">Working Hours</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Shift Start"
              type="time"
              value={settings.workHoursStart || '09:00'}
              onChange={(e: any) => setSettings({ ...settings, workHoursStart: e.target.value })}
            />
            <Field
              label="Shift End"
              type="time"
              value={settings.workHoursEnd || '17:30'}
              onChange={(e: any) => setSettings({ ...settings, workHoursEnd: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold text-lg">Annual Leave Policies</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Annual Paid Leave Days"
              type="number"
              value={settings.paidLeaveAllowance || 20}
              onChange={(e: any) => setSettings({ ...settings, paidLeaveAllowance: e.target.value })}
            />
            <Field
              label="Annual Sick Leave Days"
              type="number"
              value={settings.sickLeaveAllowance || 10}
              onChange={(e: any) => setSettings({ ...settings, sickLeaveAllowance: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Shell>
  );
}

// --- ROUTING & ROUTE GUARD ---

function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isLoading } = useApp();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation('/signin');
      } else if (user.role !== role) {
        setLocation(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      }
    }
  }, [user, role, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return user?.role === role ? <>{children}</> : <div className="min-h-[100dvh] bg-background" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/signin">{() => <Auth mode="signin" />}</Route>
      <Route path="/signup">{() => <Auth mode="signup" />}</Route>
      <Route path="/employee/dashboard">{() => <Guard role="employee"><EmployeeDashboard /></Guard>}</Route>
      <Route path="/employee/profile">{() => <Guard role="employee"><EmployeeProfile /></Guard>}</Route>
      <Route path="/employee/attendance">{() => <Guard role="employee"><AttendancePage /></Guard>}</Route>
      <Route path="/employee/leave">{() => <Guard role="employee"><LeavePage /></Guard>}</Route>
      <Route path="/employee/payroll">{() => <Guard role="employee"><PayrollPage /></Guard>}</Route>
      <Route path="/admin/dashboard">{() => <Guard role="admin"><AdminDashboard /></Guard>}</Route>
      <Route path="/admin/employees">{() => <Guard role="admin"><AdminEmployees /></Guard>}</Route>
      <Route path="/admin/attendance">{() => <Guard role="admin"><AdminAttendance /></Guard>}</Route>
      <Route path="/admin/leave-approvals">{() => <Guard role="admin"><AdminApprovals /></Guard>}</Route>
      <Route path="/admin/payroll">{() => <Guard role="admin"><AdminPayroll /></Guard>}</Route>
      <Route path="/admin/reports">{() => <Guard role="admin"><AdminReports /></Guard>}</Route>
      <Route path="/admin/settings">{() => <Guard role="admin"><AdminSettings /></Guard>}</Route>
      <Route>{() => <div className="min-h-screen grid place-items-center text-center p-6"><h1 className="text-2xl font-bold">Page Not Found</h1><Link href="/" className="mt-4 text-primary underline">Return Home</Link></div>}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Router />
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;