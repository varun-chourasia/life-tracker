import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  ListTodo, 
  Plus, 
  Trash2, 
  Trophy, 
  TrendingUp, 
  Clock,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Rocket,
  Sun,
  Moon,
  Coffee,
  BookOpen,
  Dumbbell,
  LogOut,
  RefreshCw,
  AlertTriangle,
  User as UserIcon,
  Briefcase,
  RotateCcw,
  WifiOff,
  Pencil
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// --- Firebase Imports ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, enableIndexedDbPersistence } from "firebase/firestore";

// --- Types ---
type TaskType = 'one-off' | 'daily' | 'weekly';
type Category = 'Work' | 'Personal' | 'Health' | 'Learning' | 'Urgent';
type RoutineCategory = 'Focus' | 'Health' | 'Break' | 'Sleep' | 'Work';

interface Task {
  id: string;
  title: string;
  category: Category;
  startTime: string;
  endTime: string;
  completed: boolean;
  date: string; 
  type: TaskType;
}

interface RoutineItem {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  category: RoutineCategory;
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"><RotateCcw size={18} /> Reload App</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONSTANTS ---
const DEFAULT_ROUTINE: RoutineItem[] = [
  { id: 'r1', startTime: '07:00', endTime: '07:30', activity: 'Morning Routine', category: 'Health' },
  { id: 'r2', startTime: '09:00', endTime: '12:00', activity: 'Deep Work Block', category: 'Work' },
  { id: 'r3', startTime: '12:00', endTime: '13:00', activity: 'Lunch Break', category: 'Break' },
  { id: 'r4', startTime: '13:00', endTime: '17:00', activity: 'Afternoon Focus', category: 'Focus' },
  { id: 'r5', startTime: '18:00', endTime: '19:00', activity: 'Exercise', category: 'Health' },
  { id: 'r6', startTime: '22:00', endTime: '23:00', activity: 'Wind Down', category: 'Sleep' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  Work: '#3b82f6', Personal: '#10b981', Health: '#ec4899', Learning: '#8b5cf6', Urgent: '#ef4444',
};

const ROUTINE_ICONS: Record<RoutineCategory, any> = {
  Focus: BrainCircuit, Health: Dumbbell, Break: Coffee, Sleep: Moon, Work: Briefcase
};

const ROUTINE_COLORS: Record<RoutineCategory, string> = {
  Focus: 'text-purple-600 bg-purple-100', 
  Health: 'text-green-600 bg-green-100', 
  Break: 'text-orange-600 bg-orange-100', 
  Sleep: 'text-indigo-600 bg-indigo-100', 
  Work: 'text-blue-600 bg-blue-100'
};

// --- Firebase Configuration ---
// !!! IMPORTANT: REPLACE THIS BLOCK WITH YOUR KEYS !!!
const firebaseConfig = {
  apiKey: "AIzaSyC8q6SYeUJvJWv9fHIsmK698eyn652ATGs",
  authDomain: "ds-tracker-f5cbc.firebaseapp.com",
  projectId: "ds-tracker-f5cbc",
  storageBucket: "ds-tracker-f5cbc.firebasestorage.app",
  messagingSenderId: "905667947142",
  appId: "1:905667947142:web:d3a745c2776b8dd6f93f07"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'life-os-v1'; 

// --- Persistence ---
try { enableIndexedDbPersistence(db).catch(() => {}); } catch (e) {}

// --- Helper Functions ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' });

function TrackerApp() {
  const [configError, setConfigError] = useState<string | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [user, setUser] = useState<User | null>(null);
  const [syncId, setSyncId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routine, setRoutine] = useState<RoutineItem[]>(DEFAULT_ROUTINE);
  const [routineHistory, setRoutineHistory] = useState<Record<string, string[]>>({});
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'dashboard' | 'daily' | 'calendar' | 'routine'>('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  
  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('Work');
  const [newTaskStart, setNewTaskStart] = useState('09:00');
  const [newTaskEnd, setNewTaskEnd] = useState('10:00');

  // Routine Form State
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [newRoutineActivity, setNewRoutineActivity] = useState('');
  const [newRoutineCat, setNewRoutineCat] = useState<RoutineCategory>('Focus');
  const [newRoutineStart, setNewRoutineStart] = useState('06:00');
  const [newRoutineEnd, setNewRoutineEnd] = useState('07:00');

  useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    if (firebaseConfig.apiKey.includes("PASTE_YOUR")) {
      setConfigError("Missing Firebase Configuration");
      return;
    }
    try {
      signInAnonymously(auth).catch(err => { if (navigator.onLine) setConfigError(`Auth Error: ${err.message}`); });
      const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setFirebaseInitialized(true); });
      const savedId = localStorage.getItem('life_os_sync_id');
      if (savedId) { setSyncId(savedId); setShowLoginModal(false); }
      return () => unsubscribe();
    } catch (err: any) { setConfigError(`Firebase Error: ${err.message}`); }
  }, []);

  useEffect(() => {
    if (!syncId || configError) return;
    setTasks([]); setRoutine(DEFAULT_ROUTINE); setRoutineHistory({}); setIsSyncing(true);
    let unsubscribe = () => {};
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', syncId);
      unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
        setIsSyncing(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            setTasks(Array.isArray(data.tasks) ? data.tasks : []);
            setRoutineHistory(data.routineHistory || {});
            if (data.customRoutine && Array.isArray(data.customRoutine)) setRoutine(data.customRoutine);
          }
        } else if (!docSnap.metadata.fromCache) {
          setDoc(docRef, { tasks: [], routineHistory: {}, customRoutine: DEFAULT_ROUTINE }).catch(console.error);
        }
      });
    } catch (e) { setIsSyncing(false); }
    return () => unsubscribe();
  }, [user?.uid, syncId, configError]);

  const saveData = async (newTasks: Task[], newHistory: Record<string, string[]>, newRoutine: RoutineItem[]) => {
    if (!syncId) return;
    setTasks(newTasks); setRoutineHistory(newHistory); setRoutine(newRoutine);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_data', syncId);
      await setDoc(docRef, { tasks: newTasks, routineHistory: newHistory, customRoutine: newRoutine }, { merge: true });
    } catch (e) { console.error("Save Error", e); }
  };

  const handleLogin = () => { if (!syncId.trim()) return; localStorage.setItem('life_os_sync_id', syncId); setShowLoginModal(false); };
  const handleLogout = () => { localStorage.removeItem('life_os_sync_id'); setSyncId(''); setTasks([]); setRoutineHistory({}); setShowLoginModal(true); };

  const addTask = () => {
    const newTask: Task = { id: Date.now().toString(), title: newTaskTitle, category: newTaskCategory, startTime: newTaskStart, endTime: newTaskEnd, completed: false, date: formatDate(selectedDate), type: 'one-off' };
    saveData([...tasks, newTask], routineHistory, routine); setShowAddTaskModal(false); setNewTaskTitle('');
  };

  const openAddRoutineModal = () => { setEditingRoutineId(null); setNewRoutineActivity(''); setNewRoutineStart('06:00'); setNewRoutineEnd('07:00'); setNewRoutineCat('Focus'); setShowAddRoutineModal(true); };
  const openEditRoutineModal = (item: RoutineItem) => { setEditingRoutineId(item.id); setNewRoutineActivity(item.activity); setNewRoutineStart(item.startTime); setNewRoutineEnd(item.endTime); setNewRoutineCat(item.category); setShowAddRoutineModal(true); };
  const saveRoutineItem = () => {
    let updatedRoutine;
    if (editingRoutineId) {
      updatedRoutine = routine.map(r => r.id === editingRoutineId ? { ...r, activity: newRoutineActivity, startTime: newRoutineStart, endTime: newRoutineEnd, category: newRoutineCat } : r);
    } else {
      updatedRoutine = [...routine, { id: `r-${Date.now()}`, activity: newRoutineActivity, startTime: newRoutineStart, endTime: newRoutineEnd, category: newRoutineCat }];
    }
    updatedRoutine.sort((a, b) => a.startTime.localeCompare(b.startTime));
    saveData(tasks, routineHistory, updatedRoutine); setShowAddRoutineModal(false); setEditingRoutineId(null); setNewRoutineActivity('');
  };

  const deleteRoutineItem = (id: string) => { saveData(tasks, routineHistory, routine.filter(r => r.id !== id)); };
  const toggleTask = (id: string) => { saveData(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t), routineHistory, routine); };
  const toggleRoutineItem = (routineId: string) => {
    const dateKey = formatDate(selectedDate);
    const completedToday = routineHistory[dateKey] || [];
    const newCompleted = completedToday.includes(routineId) ? completedToday.filter(id => id !== routineId) : [...completedToday, routineId];
    saveData(tasks, { ...routineHistory, [dateKey]: newCompleted }, routine);
  };
  const deleteTask = (id: string) => { saveData(tasks.filter(t => t.id !== id), routineHistory, routine); };
  const changeDate = (days: number) => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() + days); setSelectedDate(newDate); };

  const todaysTasks = useMemo(() => tasks.filter(t => t.date === formatDate(selectedDate)).sort((a, b) => a.startTime.localeCompare(b.startTime)), [tasks, selectedDate]);
  const progressStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const byCategory = Object.keys(CATEGORY_COLORS).map(cat => ({ name: cat, total: tasks.filter(t => t.category === cat).length, completed: tasks.filter(t => t.category === cat && t.completed).length })).filter(c => c.total > 0);
    return { total, completed, byCategory };
  }, [tasks]);
  const routineStats = useMemo(() => {
    const completedIds = routineHistory[formatDate(selectedDate)] || [];
    const total = routine.length;
    const percent = total === 0 ? 0 : Math.round((completedIds.length / total) * 100);
    return { total, completed: completedIds.length, percent };
  }, [routineHistory, selectedDate, routine]);
  const pieData = useMemo(() => progressStats.byCategory.map(c => ({ name: c.name, value: c.completed })), [progressStats]);
  const sortedMonths = useMemo(() => {
    const tasksByMonth: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const date = new Date(task.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
      tasksByMonth[monthKey].push(task);
    });
    return Object.keys(tasksByMonth).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(month => ({ month, tasks: tasksByMonth[month].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) }));
  }, [tasks]);

  if (configError) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans"><div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full text-center border-l-4 border-red-500"><AlertTriangle size={48} className="text-red-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-slate-800 mb-2">Setup Required</h1><p className="text-slate-600 mb-6">{configError}</p></div></div>;
  if (showLoginModal) return <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 font-sans"><div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><BrainCircuit size={32} className="text-blue-600" /></div><h1 className="text-2xl font-bold text-slate-900 mb-2">My Life OS</h1><p className="text-slate-500 mb-8">One workspace for everything.</p><input type="text" placeholder="Workspace ID (e.g. varun)" className="w-full border-2 border-slate-200 rounded-xl p-4 text-lg mb-4 focus:border-blue-500 focus:outline-none text-center font-mono" value={syncId} onChange={(e) => setSyncId(e.target.value)} /><button onClick={handleLogin} disabled={!syncId} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">Enter Workspace</button></div></div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <button onClick={() => setShowMobileMenu(true)} className="md:hidden fixed top-4 right-4 z-40 bg-white p-2 rounded-lg shadow-md text-slate-600"><Menu size={24} /></button>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center"><div className="flex items-center gap-2 font-bold text-xl"><BrainCircuit className="text-blue-400" /><span>Life OS</span></div><button onClick={() => setShowMobileMenu(false)} className="md:hidden"><X size={24} /></button></div>
        <div className="px-6 py-4 border-b border-slate-800"><div className="text-xs text-slate-500 uppercase font-bold mb-2">Workspace</div><div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2"><div className="flex items-center gap-2 overflow-hidden"><UserIcon size={14} className="text-blue-400" /><span className="font-mono text-sm text-blue-300 truncate">{syncId}</span></div><button onClick={handleLogout} className="text-slate-400 hover:text-red-400" title="Logout"><LogOut size={16} /></button></div></div>
        <nav className="flex-1 p-4 space-y-2">
          {['dashboard', 'routine', 'daily', 'calendar'].map(v => (
            <button key={v} onClick={() => { setView(v as any); setShowMobileMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg capitalize transition-colors ${view === v ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              {v === 'dashboard' && <LayoutDashboard size={20} />} {v === 'routine' && <Sun size={20} />} {v === 'daily' && <ListTodo size={20} />} {v === 'calendar' && <CalendarIcon size={20} />} {v}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={() => setShowAddTaskModal(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20"><Plus size={20} /> Add Task</button></div>
      </div>

      <main className="flex-1 h-full overflow-y-auto w-full relative">
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div><h2 className="text-2xl font-bold text-slate-800 capitalize">{view === 'calendar' ? 'Schedule' : view}</h2><p className="text-slate-500">{getDayName(selectedDate)}, {formatDate(selectedDate)}</p></div>
            <div className="flex items-center gap-3">
               {(view === 'daily' || view === 'routine') && (<div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm"><button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-md"><ChevronLeft size={24} /></button><div className="w-px h-6 bg-slate-200 mx-1"></div><button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 rounded-md"><ChevronRight size={24} /></button></div>)}
               {(view === 'daily' || view === 'calendar') && (<button onClick={() => setShowAddTaskModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"><Plus size={18}/> <span className="hidden sm:inline">Add Task</span></button>)}
               {isOffline ? <span className="text-sm text-red-500 flex items-center gap-1 font-bold"><WifiOff size={14}/> Offline</span> : isSyncing && <span className="text-sm text-slate-400 flex items-center gap-1"><RefreshCw size={14} className="animate-spin"/> Syncing...</span>}
            </div>
          </div>

          {view === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-sm text-slate-500">Tasks</p><p className="text-3xl font-bold text-slate-800">{progressStats.completed} <span className="text-sm font-normal text-slate-400">/ {progressStats.total}</span></p></div><div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 size={24} /></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-sm text-slate-500">Habits</p><p className="text-3xl font-bold text-orange-500">{routineStats.percent}% <span className="text-sm font-normal text-slate-400">Done</span></p></div><div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><Sun size={24} /></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-sm text-slate-500">Status</p><p className="text-xl font-bold text-blue-600">{progressStats.total === 0 ? "Empty" : "Active"}</p></div><div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Rocket size={24} /></div></div>
              </div>
              {progressStats.total > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Focus Areas</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={progressStats.byCategory}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f1f5f9' }} /><Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} /><Bar dataKey="total" name="Total Tasks" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-semibold mb-4">Task Distribution</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#94a3b8'} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
                </div>
              )}
            </>
          )}

          {view === 'daily' && (
            <div className="space-y-3">
              {todaysTasks.length === 0 ? <div className="text-center py-12 text-slate-400">No tasks for today.</div> : todaysTasks.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4">
                  <button onClick={() => toggleTask(t.id)} className={t.completed ? "text-green-500" : "text-slate-300"}><CheckCircle2 size={24} /></button>
                  <div className="flex-1"><h3 className={`font-medium ${t.completed ? 'line-through text-slate-400' : ''}`}>{t.title}</h3><div className="text-xs text-slate-500">{t.startTime} - {t.endTime} • {t.category}</div></div>
                  <button onClick={() => deleteTask(t.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          )}

          {view === 'routine' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-slate-700">Habits</h3><button onClick={openAddRoutineModal} className="flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"><Plus size={16}/> Add</button></div>
              <div className="divide-y divide-slate-100 bg-white rounded-xl shadow-sm border">
                {routine.map(item => {
                  const isCompleted = (routineHistory[formatDate(selectedDate)] || []).includes(item.id);
                  const IconComp = ROUTINE_ICONS[item.category] || Sun;
                  return (
                    <div key={item.id} className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-colors hover:bg-slate-50">
                      <button onClick={() => toggleRoutineItem(item.id)} className={`flex-shrink-0 ${isCompleted ? 'text-green-500' : 'text-slate-300'}`}><CheckCircle2 size={24} /></button>
                      <div className={`p-2 rounded-lg flex-shrink-0 ${ROUTINE_COLORS[item.category] || 'bg-slate-100 text-slate-600'}`}><IconComp size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <h4 className={`font-medium text-slate-800 truncate ${isCompleted ? 'line-through text-slate-400' : ''}`}>{item.activity}</h4>
                          <span className="text-xs font-mono font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600 sm:ml-4 w-fit mt-1 sm:mt-0 whitespace-nowrap">{item.startTime} - {item.endTime}</span>
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{item.category}</span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEditRoutineModal(item)} className="text-slate-300 hover:text-blue-500"><Pencil size={16}/></button>
                        <button onClick={() => deleteRoutineItem(item.id)} className="text-slate-300 hover:text-red-400"><X size={16}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'calendar' && (
            <div className="space-y-8">
              {sortedMonths.length === 0 ? <div className="text-center py-12 text-slate-400">Schedule is empty.</div> : sortedMonths.map(group => (
                <div key={group.month} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase">{group.month}</div><div className="divide-y divide-slate-100">{group.tasks.map(t => (<div key={t.id} className="p-4 flex items-center gap-4"><div className="w-12 text-center text-sm font-bold text-slate-500">{new Date(t.date).getDate()}</div><div className="flex-1"><div className={`font-medium ${t.completed ? 'line-through text-slate-400' : ''}`}>{t.title}</div><span className="text-xs text-slate-400">{t.category}</span></div><button onClick={() => toggleTask(t.id)} className={t.completed ? "text-green-500" : "text-slate-300"}><CheckCircle2 size={20}/></button></div>))}</div></div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Task</h2>
            <input className="w-full border p-2 rounded mb-4" placeholder="Task Title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-4 mb-4"><select className="border p-2 rounded" value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value as Category)}>{Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}</select><input type="date" className="border p-2 rounded" value={formatDate(selectedDate)} onChange={e => setSelectedDate(new Date(e.target.value))} /></div>
            <div className="grid grid-cols-2 gap-4 mb-4"><input type="time" className="border p-2 rounded" value={newTaskStart} onChange={e => setNewTaskStart(e.target.value)} /><input type="time" className="border p-2 rounded" value={newTaskEnd} onChange={e => setNewTaskEnd(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><button onClick={() => setShowAddTaskModal(false)} className="px-4 py-2 text-slate-500">Cancel</button><button onClick={addTask} disabled={!newTaskTitle} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button></div>
          </div>
        </div>
      )}

      {/* Add/Edit Routine Modal */}
      {showAddRoutineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingRoutineId ? 'Edit Habit' : 'Add Habit'}</h2>
            <input className="w-full border p-2 rounded mb-4" placeholder="Activity Name" value={newRoutineActivity} onChange={e => setNewRoutineActivity(e.target.value)} />
            <div className="mb-4"><label className="text-xs text-slate-500 mb-1 block">Category</label><select className="w-full border p-2 rounded" value={newRoutineCat} onChange={e => setNewRoutineCat(e.target.value as RoutineCategory)}><option value="Focus">Focus</option><option value="Health">Health</option><option value="Break">Break</option><option value="Sleep">Sleep</option><option value="Work">Work</option></select></div>
            <div className="grid grid-cols-2 gap-4 mb-4"><input type="time" className="border p-2 rounded" value={newRoutineStart} onChange={e => setNewRoutineStart(e.target.value)} /><input type="time" className="border p-2 rounded" value={newRoutineEnd} onChange={e => setNewRoutineEnd(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><button onClick={() => setShowAddRoutineModal(false)} className="px-4 py-2 text-slate-500">Cancel</button><button onClick={saveRoutineItem} disabled={!newRoutineActivity} className="px-4 py-2 bg-blue-600 text-white rounded">{editingRoutineId ? 'Update' : 'Add'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() { return <ErrorBoundary><TrackerApp /></ErrorBoundary>; }