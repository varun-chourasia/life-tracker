import {
  useState,
  useEffect,
  useMemo,
  Component,
  type ReactNode,
  useRef,
} from "react";
import {
  CheckCircle2,
  LayoutDashboard,
  Calendar as CalendarIcon,
  ListTodo,
  Plus,
  Trash2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Rocket,
  Sun,
  Moon,
  Coffee,
  Dumbbell,
  LogOut,
  RefreshCw,
  AlertTriangle,
  User as UserIcon,
  Briefcase,
  RotateCcw,
  WifiOff,
  Pencil,
  Clock,
  Play,
  Square,
  Bell,
  Trophy,
  Award,
  Flame,
  Target,
  Zap,
  Save,
  Calendar,
  LineChart as LineChartIcon,
  Download,
  AlertOctagon,
  BadgeCheck,
  Settings,
  Lock as LockIcon,
  Star,
  Shield,
  Crown,
  Medal,
  Lightbulb,
  Sword,
  Gem,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// --- Firebase Imports ---
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  enableIndexedDbPersistence,
  deleteDoc,
} from "firebase/firestore";

// --- Types ---
type TaskType = "one-off" | "daily" | "weekly";
type Category = "Work" | "Personal" | "Health" | "Learning" | "Urgent";
type RoutineCategory = "Focus" | "Health" | "Break" | "Sleep" | "Work";

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

interface UserProfile {
  displayName: string;
  age: string;
  profession: string;
  goal: string;
  bio: string;
  joinedDate: string;
}

// Notification Interface
interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  isUnlocked: (
    tasks: Task[],
    xp: number,
    level: number,
    streaks: { current: number; longest: number; totalContributions: number }
  ) => boolean;
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
          <div className="bg-slate-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center border border-slate-700">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-xs text-red-400 mb-4 font-mono bg-red-900/20 p-2 rounded border border-red-900/50">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
            >
              <RotateCcw size={18} /> Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONSTANTS ---
const DEFAULT_ROUTINE: RoutineItem[] = [
  {
    id: "r1",
    startTime: "04:30",
    endTime: "05:00",
    activity: "Wake Up & Hydrate",
    category: "Health",
  },
  {
    id: "r2",
    startTime: "05:00",
    endTime: "07:00",
    activity: "Study Session 1",
    category: "Focus",
  },
  {
    id: "r3",
    startTime: "07:00",
    endTime: "08:30",
    activity: "Gym / Exercise",
    category: "Health",
  },
  {
    id: "r4",
    startTime: "08:30",
    endTime: "09:30",
    activity: "Breakfast & Shower",
    category: "Break",
  },
  {
    id: "r5",
    startTime: "09:30",
    endTime: "12:30",
    activity: "Study Session 2",
    category: "Focus",
  },
  {
    id: "r6",
    startTime: "12:30",
    endTime: "13:30",
    activity: "Lunch",
    category: "Break",
  },
  {
    id: "r7",
    startTime: "13:30",
    endTime: "14:00",
    activity: "Power Nap",
    category: "Sleep",
  },
  {
    id: "r8",
    startTime: "14:00",
    endTime: "17:00",
    activity: "Study Session 3",
    category: "Work",
  },
  {
    id: "r9",
    startTime: "17:00",
    endTime: "17:30",
    activity: "Evening Walk",
    category: "Health",
  },
  {
    id: "r10",
    startTime: "17:30",
    endTime: "19:30",
    activity: "Study Session 4",
    category: "Focus",
  },
  {
    id: "r11",
    startTime: "19:30",
    endTime: "20:30",
    activity: "Dinner",
    category: "Break",
  },
  {
    id: "r12",
    startTime: "20:30",
    endTime: "22:00",
    activity: "Personal Time",
    category: "Focus",
  },
  {
    id: "r13",
    startTime: "22:00",
    endTime: "23:00",
    activity: "Wind Down",
    category: "Sleep",
  },
];

const CATEGORY_COLORS: Record<Category, string> = {
  Work: "#3b82f6",
  Personal: "#10b981",
  Health: "#ec4899",
  Learning: "#8b5cf6",
  Urgent: "#ef4444",
};
const CATEGORY_BG_COLORS: Record<Category, string> = {
  Work: "bg-blue-500",
  Personal: "bg-emerald-500",
  Health: "bg-pink-500",
  Learning: "bg-violet-500",
  Urgent: "bg-red-500",
};

const ROUTINE_ICONS: Record<RoutineCategory, any> = {
  Focus: BrainCircuit,
  Health: Dumbbell,
  Break: Coffee,
  Sleep: Moon,
  Work: Briefcase,
};
const ROUTINE_COLORS: Record<RoutineCategory, string> = {
  Focus: "text-purple-400 bg-purple-900/30",
  Health: "text-green-400 bg-green-900/30",
  Break: "text-orange-400 bg-orange-900/30",
  Sleep: "text-indigo-400 bg-indigo-900/30",
  Work: "text-blue-400 bg-blue-900/30",
};

const PROFESSIONS = [
  "Student",
  "Employee",
  "Freelancer",
  "Developer",
  "Entrepreneur",
  "Other",
];
const GOAL_TYPES = [
  "Building Consistency",
  "Studying / Upskilling",
  "Career Switch",
  "Health & Fitness",
  "Project Completion",
];

const BADGES: Badge[] = [
  {
    id: "first_blood",
    name: "First Blood",
    description: "Complete 1st task",
    icon: Rocket,
    color: "text-red-400 bg-red-900/30",
    isUnlocked: (t) => t.some((x) => x.completed),
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Task before 8 AM",
    icon: Sun,
    color: "text-orange-400 bg-orange-900/30",
    isUnlocked: (t) =>
      t.some((x) => x.completed && parseInt(x.startTime.split(":")[0]) < 8),
  },
  {
    id: "machine",
    name: "The Machine",
    description: "10+ tasks done",
    icon: BrainCircuit,
    color: "text-blue-400 bg-blue-900/30",
    isUnlocked: (t) => t.filter((x) => x.completed).length >= 10,
  },
  {
    id: "level_5",
    name: "High Flyer",
    description: "Reach Level 5",
    icon: Trophy,
    color: "text-yellow-400 bg-yellow-900/30",
    isUnlocked: (_, __, l) => l >= 5,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Task after 8 PM",
    icon: Moon,
    color: "text-indigo-400 bg-indigo-900/30",
    isUnlocked: (t) =>
      t.some((x) => x.completed && parseInt(x.startTime.split(":")[0]) >= 20),
  },
  {
    id: "starter",
    name: "Just Start",
    description: "Add 5 tasks",
    icon: Plus,
    color: "text-gray-400 bg-gray-800",
    isUnlocked: (t) => t.length >= 5,
  },
  {
    id: "mid_day",
    name: "Lunch Crunch",
    description: "Task at 12 PM",
    icon: Sun,
    color: "text-yellow-400 bg-yellow-900/30",
    isUnlocked: (t) =>
      t.some((x) => x.completed && x.startTime.startsWith("12")),
  },
  {
    id: "machine_50",
    name: "Productivity God",
    description: "50 tasks done",
    icon: Zap,
    color: "text-yellow-400 bg-yellow-900/30",
    isUnlocked: (t) => t.filter((x) => x.completed).length >= 50,
  },
  {
    id: "machine_100",
    name: "Centurion",
    description: "100 tasks done",
    icon: Crown,
    color: "text-purple-400 bg-purple-900/30",
    isUnlocked: (t) => t.filter((x) => x.completed).length >= 100,
  },
  {
    id: "machine_500",
    name: "Legend",
    description: "500 tasks done",
    icon: Gem,
    color: "text-teal-400 bg-teal-900/30",
    isUnlocked: (t) => t.filter((x) => x.completed).length >= 500,
  },
  {
    id: "idea",
    name: "Idea Machine",
    description: "Add 50 tasks",
    icon: Lightbulb,
    color: "text-yellow-300 bg-yellow-900/30",
    isUnlocked: (t) => t.length >= 50,
  },
  {
    id: "streak_3",
    name: "Hat Trick",
    description: "3 Day Streak",
    icon: Flame,
    color: "text-orange-400 bg-orange-900/30",
    isUnlocked: (_, __, ___, s) => s.longest >= 3,
  },
  {
    id: "streak_7",
    name: "On Fire",
    description: "7 Day Streak",
    icon: Flame,
    color: "text-red-400 bg-red-900/30",
    isUnlocked: (_, __, ___, s) => s.longest >= 7,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    description: "30 Day Streak",
    icon: Flame,
    color: "text-purple-400 bg-purple-900/30",
    isUnlocked: (_, __, ___, s) => s.longest >= 30,
  },
  {
    id: "consistent",
    name: "Steady Hand",
    description: "5 Day Current",
    icon: Target,
    color: "text-teal-400 bg-teal-900/30",
    isUnlocked: (_, __, ___, s) => s.current >= 5,
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "14 Day Streak",
    icon: Shield,
    color: "text-gray-300 bg-gray-700",
    isUnlocked: (_, __, ___, s) => s.longest >= 14,
  },
  {
    id: "gym_rat",
    name: "Gym Rat",
    description: "10 Health tasks",
    icon: Dumbbell,
    color: "text-green-400 bg-green-900/30",
    isUnlocked: (t) =>
      t.filter((x) => x.completed && x.category === "Health").length >= 10,
  },
  {
    id: "code_warrior",
    name: "Code Warrior",
    description: "10 Work tasks",
    icon: Briefcase,
    color: "text-blue-400 bg-blue-900/30",
    isUnlocked: (t) =>
      t.filter((x) => x.completed && x.category === "Work").length >= 10,
  },
  {
    id: "bookworm",
    name: "Scholar",
    description: "10 Learning tasks",
    icon: BookOpen,
    color: "text-pink-400 bg-pink-900/30",
    isUnlocked: (t) =>
      t.filter((x) => x.completed && x.category === "Learning").length >= 10,
  },
  {
    id: "life_saver",
    name: "Life Saver",
    description: "5 Urgent tasks",
    icon: AlertTriangle,
    color: "text-red-400 bg-red-900/30",
    isUnlocked: (t) =>
      t.filter((x) => x.completed && x.category === "Urgent").length >= 5,
  },
  {
    id: "balanced",
    name: "Zen Master",
    description: "3+ Cats Used",
    icon: Star,
    color: "text-cyan-400 bg-cyan-900/30",
    isUnlocked: (t) => {
      const counts = t
        .filter((x) => x.completed)
        .reduce((acc: any, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + 1;
          return acc;
        }, {});
      return Object.keys(counts).length >= 3;
    },
  },
  {
    id: "lvl_10",
    name: "Pro",
    description: "Reach Level 10",
    icon: Medal,
    color: "text-yellow-400 bg-yellow-900/30",
    isUnlocked: (_, __, l) => l >= 10,
  },
  {
    id: "lvl_25",
    name: "Elite",
    description: "Reach Level 25",
    icon: Medal,
    color: "text-purple-400 bg-purple-900/30",
    isUnlocked: (_, __, l) => l >= 25,
  },
  {
    id: "lvl_50",
    name: "Master",
    description: "Reach Level 50",
    icon: Trophy,
    color: "text-yellow-300 bg-yellow-900/30",
    isUnlocked: (_, __, l) => l >= 50,
  },
  {
    id: "xp_1k",
    name: "XP Rich",
    description: "Earn 1000 XP",
    icon: Target,
    color: "text-green-400 bg-green-900/30",
    isUnlocked: (_, xp) => xp >= 1000,
  },
  {
    id: "weekend_warrior",
    name: "Weekender",
    description: "5 Weekend tasks",
    icon: Coffee,
    color: "text-orange-400 bg-orange-900/30",
    isUnlocked: (t) =>
      t.filter(
        (x) =>
          x.completed &&
          (new Date(x.date).getDay() === 0 || new Date(x.date).getDay() === 6)
      ).length >= 5,
  },
  {
    id: "perfectionist",
    name: "Clean Sweep",
    description: "Complete all today",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-900/30",
    isUnlocked: (t) => {
      const today = new Date().toISOString().split("T")[0];
      const todays = t.filter((x) => x.date === today);
      return todays.length > 2 && todays.every((x) => x.completed);
    },
  },
  {
    id: "planner",
    name: "Visionary",
    description: "Task 1 week out",
    icon: Calendar,
    color: "text-blue-300 bg-blue-900/30",
    isUnlocked: (t) => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return t.some((x) => new Date(x.date) >= nextWeek);
    },
  },
  {
    id: "slayer",
    name: "Dragon Slayer",
    description: "Urgent done",
    icon: Sword,
    color: "text-red-500 bg-red-900/30",
    isUnlocked: (t) => t.some((x) => x.completed && x.category === "Urgent"),
  },
  {
    id: "student",
    name: "Graduate",
    description: "Profile Complete",
    icon: GraduationCap,
    color: "text-blue-400 bg-blue-900/30",
    isUnlocked: () => true,
  },
];

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyC8q6SYeUJvJWv9fHIsmK698eyn652ATGs",
  authDomain: "ds-tracker-f5cbc.firebaseapp.com",
  projectId: "ds-tracker-f5cbc",
  storageBucket: "ds-tracker-f5cbc.firebasestorage.app",
  messagingSenderId: "905667947142",
  appId: "1:905667947142:web:d3a745c2776b8dd6f93f07",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "life-os-v1";
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

// --- Helper Functions ---
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getDayName = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long" });
const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// NEW: 12-Hour Time Formatter
const formatTime12 = (time24: string) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// --- STREAK CALCULATOR ---
const calculateStreaks = (tasks: Task[]) => {
  const activeDates = [
    ...new Set(tasks.filter((t) => t.completed).map((t) => t.date)),
  ].sort();
  let currentStreak = 0,
    longestStreak = 0,
    tempStreak = 0;
  const today = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  for (let i = 0; i < activeDates.length; i++) {
    if (i > 0) {
      const prev = new Date(activeDates[i - 1]);
      const curr = new Date(activeDates[i]);
      const diffDays = Math.round(
        Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) tempStreak++;
      else tempStreak = 1;
    } else tempStreak = 1;
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  if (activeDates.includes(today)) {
    currentStreak = 1;
    let checkDate = new Date();
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (activeDates.includes(formatDate(checkDate))) currentStreak++;
      else break;
    }
  } else if (activeDates.includes(yesterdayStr)) {
    currentStreak = 1;
    let checkDate = new Date(yesterday);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (activeDates.includes(formatDate(checkDate))) currentStreak++;
      else break;
    }
  } else {
    currentStreak = 0;
  }
  if (activeDates.length === 0) {
    currentStreak = 0;
    longestStreak = 0;
  }
  return {
    current: currentStreak,
    longest: longestStreak,
    totalContributions: tasks.filter((t) => t.completed).length,
  };
};

function TrackerApp() {
  const [configError, setConfigError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">(
    "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // State definitions MOVED TO TOP
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routine, setRoutine] = useState<RoutineItem[]>(DEFAULT_ROUTINE);
  const [routineHistory, setRoutineHistory] = useState<
    Record<string, string[]>
  >({});
  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: "",
    age: "",
    profession: PROFESSIONS[0],
    goal: GOAL_TYPES[0],
    bio: "",
    joinedDate: formatDate(new Date()),
  });

  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Notifications
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(
    []
  );
  const [showNotifications, setShowNotifications] = useState(false);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>("default");
  const [notifiedTasks, setNotifiedTasks] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [heatmapDate, setHeatmapDate] = useState<Date>(new Date());

  const [view, setView] = useState<
    "dashboard" | "daily" | "calendar" | "routine" | "profile" | "settings"
  >("dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const [badgeSlide, setBadgeSlide] = useState(0);
  const [nameError, setNameError] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Category>("Work");
  const [newTaskStart, setNewTaskStart] = useState("09:00");
  const [newTaskEnd, setNewTaskEnd] = useState("10:00");

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [newRoutineActivity, setNewRoutineActivity] = useState("");
  const [newRoutineCat, setNewRoutineCat] = useState<RoutineCategory>("Focus");
  const [newRoutineStart, setNewRoutineStart] = useState("06:00");
  const [newRoutineEnd, setNewRoutineEnd] = useState("07:00");

  const notifRef = useRef<HTMLDivElement>(null);

  // --- CALCULATE STREAKS & DERIVED STATE ---
  const streakData = useMemo(() => calculateStreaks(tasks), [tasks]);
  const sortedBadges = useMemo(() => {
    return [...BADGES].sort((a, b) => {
      const aUnlocked = a.isUnlocked(tasks, xp, level, streakData);
      const bUnlocked = b.isUnlocked(tasks, xp, level, streakData);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      return 0;
    });
  }, [tasks, xp, level, streakData]);

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === formatDate(selectedDate))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [tasks, selectedDate]
  );
  const routineStats = useMemo(() => {
    const completedIds = routineHistory[formatDate(selectedDate)] || [];
    const total = routine.length;
    const percent =
      total === 0 ? 0 : Math.round((completedIds.length / total) * 100);
    return { total, completed: completedIds.length, percent };
  }, [routineHistory, selectedDate, routine]);
  const sortedMonths = useMemo(() => {
    const tasksByMonth: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const date = new Date(task.date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
      tasksByMonth[monthKey].push(task);
    });
    return Object.keys(tasksByMonth)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((month) => ({
        month,
        tasks: tasksByMonth[month].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));
  }, [tasks]);

  const monthGrid = useMemo(() => {
    const year = heatmapDate.getFullYear();
    const month = heatmapDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const blanks = Array.from({ length: startDay }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const dateStr = formatDate(d);
      const count = tasks.filter(
        (t) => t.date === dateStr && t.completed
      ).length;
      return { date: d.getDate(), count, fullDate: dateStr };
    });
    return [...blanks, ...days];
  }, [tasks, heatmapDate]);

  const weeklyTrendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const count = tasks.filter(
        (t) => t.date === dateStr && t.completed
      ).length;
      data.push({
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        tasks: count,
      });
    }
    return data;
  }, [tasks]);

  const focusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    todaysTasks.forEach((t) => {
      if (t.completed) {
        distribution[t.category] = (distribution[t.category] || 0) + 1;
      }
    });
    return Object.keys(distribution).map((key) => ({
      name: key,
      value: distribution[key],
    }));
  }, [todaysTasks]);

  useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    if ("Notification" in window)
      Notification.requestPermission().then(setNotifPermission);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Notification System ---
  const addNotification = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" = "info"
  ) => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
      type,
    };
    setAppNotifications((prev) => [newNotif, ...prev]);
    if (notifPermission === "granted") {
      try {
        new Notification(title, { body: message, icon: "/pwa-192x192.png" });
      } catch (e) {}
    }
  };

  // --- Audio Sound ---
  const playSound = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  // --- Logic hooks ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeVal = now.getHours() * 60 + now.getMinutes();
      const todayStr = formatDate(now);
      const todaysTasks = tasks.filter((t) => t.date === todayStr);
      todaysTasks.forEach((task) => {
        if (task.completed || notifiedTasks.includes(task.id)) return;
        const [endH, endM] = task.endTime.split(":").map(Number);
        if (currentTimeVal > endH * 60 + endM) {
          addNotification(
            "⚠️ Task Overdue!",
            `You haven't marked '${task.title}' as complete yet.`,
            "warning"
          );
          setNotifiedTasks((prev) => [...prev, task.id]);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, notifiedTasks]);

  useEffect(() => {
    if (activeTaskId && timeLeft > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            playSound();
            const task = tasks.find((t) => t.id === activeTaskId);
            addNotification(
              "⏰ Time's Up!",
              `You finished the session for: ${task?.title}`,
              "success"
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTaskId, timeLeft, isPaused, tasks]);

  useEffect(() => {
    if (firebaseConfig.apiKey.includes("PASTE_YOUR")) {
      setConfigError("Missing Firebase Config");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setTasks([]);
    setRoutine(DEFAULT_ROUTINE);
    setRoutineHistory({});
    setXp(0);
    setLevel(1);
    setIsSyncing(true);
    let unsubscribe = () => {};
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "data",
        "main"
      );
      unsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (docSnap) => {
          setIsSyncing(false);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              setTasks(Array.isArray(data.tasks) ? data.tasks : []);
              setRoutineHistory(data.routineHistory || {});
              if (data.customRoutine && Array.isArray(data.customRoutine))
                setRoutine(data.customRoutine);
              setXp(data.xp || 0);
              setLevel(data.level || 1);
              if (data.profile) {
                setUserProfile(data.profile);
                if (!data.profile.displayName || !data.profile.goal)
                  setShowOnboarding(true);
              } else {
                setShowOnboarding(true);
              }
            }
          } else if (!docSnap.metadata.fromCache) {
            setDoc(docRef, {
              tasks: [],
              routineHistory: {},
              customRoutine: DEFAULT_ROUTINE,
              xp: 100,
              level: 1,
              profile: userProfile,
            }).catch(console.error);
          }
        }
      );
    } catch (e) {
      setIsSyncing(false);
    }
    return () => unsubscribe();
  }, [user?.uid]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    try {
      if (authMode === "login")
        await signInWithEmailAndPassword(auth, email, password);
      else if (authMode === "register")
        await createUserWithEmailAndPassword(auth, email, password);
      else if (authMode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setAuthSuccess("Password reset email sent! Check your inbox.");
        setAuthMode("login");
      }
    } catch (err: any) {
      setAuthError(err.message.replace("Firebase:", "").trim());
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setTasks([]);
    setRoutineHistory({});
    setShowOnboarding(false);
  };
  const handleVerifyEmail = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        alert("Verification email sent! Check your inbox.");
      } catch (e: any) {
        alert("Error: " + e.message);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    if (
      window.confirm(
        "⚠️ DANGER ZONE \n\nAre you sure you want to delete your account? This cannot be undone."
      )
    ) {
      try {
        await deleteDoc(
          doc(db, "artifacts", appId, "users", user.uid, "data", "main")
        );
        try {
          await deleteUser(user);
        } catch (error: any) {
          if (error.code === "auth/requires-recent-login") {
            const password = prompt(
              "Security Check: Please re-enter your password to confirm deletion:"
            );
            if (password) {
              const credential = EmailAuthProvider.credential(
                user.email,
                password
              );
              await reauthenticateWithCredential(user, credential);
              await deleteUser(user);
            }
          } else {
            throw error;
          }
        }
        handleLogout();
      } catch (error: any) {
        alert("Error deleting account: " + error.message);
      }
    }
  };

  const handleResetStats = async () => {
    if (!user) return;
    if (window.confirm("Reset tasks and XP?")) {
      saveData([], {}, routine, 0, 1, userProfile);
      alert("Stats reset.");
    }
  };

  const handleExportData = () => {
    const data = JSON.stringify(
      {
        tasks,
        routine,
        routineHistory,
        userProfile,
        xp,
        level,
        exportDate: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Chronoly_backup_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveData = async (
    newTasks: Task[],
    newHistory: Record<string, string[]>,
    newRoutine: RoutineItem[],
    xpOverride?: number,
    levelOverride?: number,
    profileOverride?: UserProfile
  ) => {
    if (!user) return;
    setTasks(newTasks);
    setRoutineHistory(newHistory);
    setRoutine(newRoutine);
    if (profileOverride) setUserProfile(profileOverride);
    const finalXp = xpOverride !== undefined ? xpOverride : xp;
    const finalLevel = levelOverride !== undefined ? levelOverride : level;
    const finalProfile = profileOverride || userProfile;
    try {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "data",
        "main"
      );
      await setDoc(
        docRef,
        {
          tasks: newTasks,
          routineHistory: newHistory,
          customRoutine: newRoutine,
          xp: finalXp,
          level: finalLevel,
          profile: finalProfile,
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Save Error", e);
    }
  };

  const saveProfileUpdate = () => {
    setNameError(null);
    if (!userProfile.displayName || userProfile.displayName.length > 12) {
      addNotification(
        "Profile Error",
        "Name must be 1-12 characters.",
        "warning"
      );
      return;
    }
    const ageNum = parseInt(userProfile.age);
    if (isNaN(ageNum) || ageNum < 15 || ageNum > 80) {
      addNotification(
        "Profile Error",
        "Age must be between 15 and 80.",
        "warning"
      );
      return;
    }

    saveData(tasks, routineHistory, routine, xp, level, userProfile);
    setShowEditProfileModal(false);
    addNotification(
      "Profile Updated",
      "Your details have been saved.",
      "success"
    );
  };

  const finishOnboarding = () => {
    setNameError(null);
    if (!userProfile.displayName || userProfile.displayName.length > 12) {
      setNameError("Name must be 1-12 characters.");
      return;
    }
    const ageNum = parseInt(userProfile.age);
    if (isNaN(ageNum) || ageNum < 15 || ageNum > 80) {
      addNotification(
        "Profile Error",
        "Age must be between 15 and 80.",
        "warning"
      );
      return;
    }

    saveData(tasks, routineHistory, routine, xp, level, userProfile);
    setShowOnboarding(false);
  };

  const updateXp = (amount: number) => {
    let newXp = xp + amount;
    let newLevel = level;
    const xpPerLevel = 100;
    if (amount > 0) {
      if (newXp >= xpPerLevel) {
        newXp = newXp - xpPerLevel;
        newLevel = level + 1;
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
    } else {
      if (newXp < 0) {
        if (level > 1) {
          newLevel = level - 1;
          newXp = xpPerLevel + newXp;
        } else {
          newXp = 0;
        }
      }
    }
    setXp(newXp);
    setLevel(newLevel);
    return { newXp, newLevel };
  };

  const addTask = () => {
    const todayStr = formatDate(new Date());
    if (newTaskTitle.trim() === "") return;
    if (formatDate(selectedDate) < todayStr) {
      alert("Cannot schedule tasks for past dates!");
      return;
    }

    // CHECK FOR TIME CONFLICT
    const isConflict = tasks.some(
      (t) => t.date === formatDate(selectedDate) && t.startTime === newTaskStart
    );

    if (isConflict) {
      alert("You already have a task scheduled at this time!");
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: newTaskCategory,
      startTime: newTaskStart,
      endTime: newTaskEnd,
      completed: false,
      date: formatDate(selectedDate),
      type: "one-off",
    };
    saveData([...tasks, newTask], routineHistory, routine);
    setShowAddTaskModal(false);
    setNewTaskTitle("");
  };

  const startTimer = (task: Task) => {
    if (activeTaskId === task.id) {
      setIsPaused(!isPaused);
    } else {
      setActiveTaskId(task.id);
      setIsPaused(false);
      const [sH, sM] = task.startTime.split(":").map(Number);
      const [eH, eM] = task.endTime.split(":").map(Number);
      const duration = (eH * 60 + eM - (sH * 60 + sM)) * 60;
      setTimeLeft(duration > 0 ? duration : 1500);
    }
  };

  const stopTimer = () => {
    setActiveTaskId(null);
    setTimeLeft(0);
    setIsPaused(false);
  };

  const openAddRoutineModal = () => {
    setEditingRoutineId(null);
    setNewRoutineActivity("");
    setNewRoutineStart("06:00");
    setNewRoutineEnd("07:00");
    setNewRoutineCat("Focus");
    setShowAddRoutineModal(true);
  };
  const openEditRoutineModal = (item: RoutineItem) => {
    setEditingRoutineId(item.id);
    setNewRoutineActivity(item.activity);
    setNewRoutineStart(item.startTime);
    setNewRoutineEnd(item.endTime);
    setNewRoutineCat(item.category);
    setShowAddRoutineModal(true);
  };
  const saveRoutineItem = () => {
    let updatedRoutine;
    if (editingRoutineId) {
      updatedRoutine = routine.map((r) =>
        r.id === editingRoutineId
          ? {
              ...r,
              activity: newRoutineActivity,
              startTime: newRoutineStart,
              endTime: newRoutineEnd,
              category: newRoutineCat,
            }
          : r
      );
    } else {
      updatedRoutine = [
        ...routine,
        {
          id: `r-${Date.now()}`,
          activity: newRoutineActivity,
          startTime: newRoutineStart,
          endTime: newRoutineEnd,
          category: newRoutineCat,
        },
      ];
    }
    updatedRoutine.sort((a, b) => a.startTime.localeCompare(b.startTime));
    saveData(tasks, routineHistory, updatedRoutine);
    setShowAddRoutineModal(false);
    setEditingRoutineId(null);
    setNewRoutineActivity("");
  };
  const deleteRoutineItem = (id: string) => {
    saveData(
      tasks,
      routineHistory,
      routine.filter((r) => r.id !== id)
    );
  };
  const toggleTask = (id: string) => {
    if (activeTaskId === id) setActiveTaskId(null);
    const task = tasks.find((t) => t.id === id);
    const isCompleting = !task?.completed;
    const newTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    const xpChange = isCompleting ? 20 : -20;
    const xpData = updateXp(xpChange);
    saveData(newTasks, routineHistory, routine, xpData.newXp, xpData.newLevel);
    if (isCompleting)
      addNotification("Task Completed", `+20 XP: ${task?.title}`, "success");
  };
  const toggleRoutineItem = (routineId: string) => {
    const dateKey = formatDate(selectedDate);
    const completedToday = routineHistory[dateKey] || [];
    const isCompleting = !completedToday.includes(routineId);
    const newCompleted = isCompleting
      ? [...completedToday, routineId]
      : completedToday.filter((id) => id !== routineId);
    const xpChange = isCompleting ? 10 : -10;
    const xpData = updateXp(xpChange);
    saveData(
      tasks,
      { ...routineHistory, [dateKey]: newCompleted },
      routine,
      xpData.newXp,
      xpData.newLevel
    );
    if (isCompleting) addNotification("Habit Done", "+10 XP", "success");
  };
  const deleteTask = (id: string) => {
    saveData(
      tasks.filter((t) => t.id !== id),
      routineHistory,
      routine
    );
  };
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };
  const changeHeatmapMonth = (months: number) => {
    const newDate = new Date(heatmapDate);
    newDate.setMonth(newDate.getMonth() + months);
    setHeatmapDate(newDate);
  };
  const nextBadgeSlide = () =>
    setBadgeSlide((prev) => ((prev + 1) * 5 < BADGES.length ? prev + 1 : 0));
  const prevBadgeSlide = () =>
    setBadgeSlide((prev) =>
      prev > 0 ? prev - 1 : Math.floor((BADGES.length - 1) / 5)
    );
  const unreadCount = appNotifications.filter((n) => !n.read).length;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-slate-800 text-slate-500";
    if (count <= 2)
      return "bg-indigo-900 text-indigo-300 font-bold border border-indigo-700";
    if (count <= 4)
      return "bg-indigo-600 text-white font-bold border border-indigo-500";
    return "bg-violet-500 text-white font-bold border border-violet-400 shadow-glow";
  };

  if (configError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans select-none">
        <div className="bg-slate-800 p-8 rounded-xl shadow-xl max-w-lg w-full text-center border-l-4 border-red-500">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Setup Required</h1>
          <p className="text-slate-300 mb-6">{configError}</p>
        </div>
      </div>
    );

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-700">
          <div className="bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <BrainCircuit size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {authMode === "login"
              ? "Welcome Back"
              : authMode === "register"
              ? "Join Chronoly"
              : "Reset Password"}
          </h1>
          <p className="text-slate-400 mb-6">
            Secure your goals. Track your life.
          </p>
          {authError && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded mb-4 text-sm border border-red-800">
              {authError}
            </div>
          )}
          {authMode === "login" && authSuccess && (
            <div className="bg-green-900/30 text-green-400 p-3 rounded mb-4 text-sm border border-green-800">
              {authSuccess}
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full bg-slate-700 border-slate-600 text-white rounded-xl p-3 outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {authMode !== "reset" && (
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-xl p-3 outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
            >
              {authMode === "login"
                ? "Login"
                : authMode === "register"
                ? "Sign Up"
                : "Send Reset Link"}
            </button>
          </form>
          <div className="mt-4 text-sm text-slate-400 space-y-2">
            {authMode === "login" && (
              <button
                onClick={() => setAuthMode("reset")}
                className="block w-full text-slate-500 hover:text-slate-300 text-xs mb-4"
              >
                Forgot Password?
              </button>
            )}
            {authMode === "login" ? "New here? " : "Already have an account? "}{" "}
            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
              className="text-blue-400 font-bold hover:underline"
            >
              {authMode === "login" ? "Create Account" : "Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to Chronoly
          </h2>
          <p className="text-slate-400 mb-6">Let's set up your profile.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              {/* Inline Error for Name */}
              {nameError && (
                <p className="text-xs text-red-400 mb-1 font-bold">
                  {nameError}
                </p>
              )}
              <input
                className={`w-full bg-slate-700 border ${
                  nameError ? "border-red-500" : "border-slate-600"
                } text-white rounded-lg p-2`}
                value={userProfile.displayName}
                onChange={(e) => {
                  setUserProfile({
                    ...userProfile,
                    displayName: e.target.value,
                  });
                  if (e.target.value) setNameError(null);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                  Age
                </label>
                <input
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                  type="number"
                  value={userProfile.age}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, age: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                  Profession
                </label>
                <select
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                  value={userProfile.profession}
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      profession: e.target.value,
                    })
                  }
                >
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">
                Main Goal
              </label>
              <select
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                value={userProfile.goal}
                onChange={(e) =>
                  setUserProfile({ ...userProfile, goal: e.target.value })
                }
              >
                {GOAL_TYPES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={finishOnboarding}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition mt-4"
            >
              Start My Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-white dark select-none w-full overflow-x-hidden max-w-full">
      {showLevelUp && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-slate-900 px-6 py-3 rounded-full shadow-xl z-50 font-bold animate-bounce flex items-center gap-2">
          <Trophy size={24} /> LEVEL UP! You are now Lvl {level}
        </div>
      )}

      {/* MOBILE TOP RIGHT CONTROLS (FIXED) */}
      <div className="md:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Mobile Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg shadow-md transition ${
              showNotifications
                ? "bg-slate-700 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
            title="Notifications"
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right">
              <div className="p-3 border-b border-slate-700 flex justify-between items-center">
                <span className="font-bold text-sm text-white">
                  Notifications
                </span>
                <button
                  onClick={() => setAppNotifications([])}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {appNotifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  appNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border-b border-slate-700/50 hover:bg-slate-700 transition"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-xs font-bold ${
                            n.type === "success"
                              ? "text-green-400"
                              : n.type === "warning"
                              ? "text-orange-400"
                              : "text-blue-400"
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="bg-slate-800 p-2 rounded-lg shadow-md text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-400">
            <BrainCircuit />
            <span>Chronoly</span>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="md:hidden"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-yellow-400">Lvl {level}</span>
              <span className="text-xs text-slate-400">
                {xp} / {level * 100} XP
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-700">
              <div
                className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(xp / (level * 100)) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {userProfile.displayName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm truncate w-24">
                  {userProfile.displayName}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-24">
                  {userProfile.profession}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            "dashboard",
            "routine",
            "daily",
            "calendar",
            "profile",
            "settings",
          ].map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v as any);
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg capitalize transition-colors ${
                view === v
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {v === "dashboard" && <LayoutDashboard size={20} />}{" "}
              {v === "routine" && <Sun size={20} />}{" "}
              {v === "daily" && <ListTodo size={20} />}{" "}
              {v === "calendar" && <CalendarIcon size={20} />}{" "}
              {v === "profile" && <UserIcon size={20} />}{" "}
              {v === "settings" && <Settings size={20} />} {v}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20"
          >
            <Plus size={20} /> Add Task
          </button>
        </div>
      </div>

      <main
        className={`flex-1 h-full overflow-y-auto w-full relative bg-slate-900 ${
          activeTaskId ? "pb-24" : ""
        }`}
      >
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">
                {view === "calendar" ? "Schedule" : view}
              </h2>
              <p className="text-slate-400">
                {getDayName(selectedDate)}, {formatDate(selectedDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* DESKTOP NOTIFICATION (Hidden on Mobile) */}
              <div className="relative hidden md:block" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full transition ${
                    showNotifications ? "bg-slate-700" : "bg-slate-800"
                  } border border-slate-700`}
                  title="Notifications"
                >
                  <Bell
                    size={18}
                    className={
                      unreadCount > 0 ? "text-blue-400" : "text-slate-400"
                    }
                  />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-sm text-white">
                        Notifications
                      </span>
                      <button
                        onClick={() => setAppNotifications([])}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {appNotifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No new notifications
                        </div>
                      ) : (
                        appNotifications.map((n) => (
                          <div
                            key={n.id}
                            className="p-3 border-b border-slate-700/50 hover:bg-slate-700 transition"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span
                                className={`text-xs font-bold ${
                                  n.type === "success"
                                    ? "text-green-400"
                                    : n.type === "warning"
                                    ? "text-orange-400"
                                    : "text-blue-400"
                                }`}
                              >
                                {n.title}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(view === "daily" || view === "routine") && (
                <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-700 bg-slate-800">
                  <button
                    onClick={() => changeDate(-1)}
                    className="p-2 hover:bg-slate-700 rounded-md text-slate-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-px h-6 bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => changeDate(1)}
                    className="p-2 hover:bg-slate-700 rounded-md text-slate-300"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              {/* FIXED: Make Add Button visible on Mobile for Daily/Calendar */}
              {(view === "daily" || view === "calendar") && (
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  <Plus size={18} />{" "}
                  <span className="hidden sm:inline">Add Task</span>
                </button>
              )}
              {isOffline ? (
                <span className="text-sm text-red-500 flex items-center gap-1 font-bold">
                  <WifiOff size={14} /> Offline
                </span>
              ) : (
                isSyncing && (
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <RefreshCw size={14} className="animate-spin" /> Syncing...
                  </span>
                )
              )}
            </div>
          </div>

          {/* FLOATING ACTIVE TASK BAR */}
          {activeTaskId && (
            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-slate-800 border-t border-slate-700 p-4 z-40 flex items-center justify-between shadow-[0_-4px_15px_rgba(0,0,0,0.3)] animate-slide-up">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400">
                  <Clock className="animate-pulse" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Focus Mode
                  </p>
                  <h4 className="text-sm font-bold text-white truncate">
                    {tasks.find((t) => t.id === activeTaskId)?.title}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-blue-400 w-16 text-center">
                  {formatTimer(timeLeft)}
                </span>
                <button
                  onClick={() =>
                    startTimer(tasks.find((t) => t.id === activeTaskId)!)
                  }
                  className={`p-2 rounded-full transition ${
                    activeTaskId ? "bg-yellow-900/30 text-yellow-400" : ""
                  }`}
                >
                  {isPaused ? (
                    <Play size={20} fill="currentColor" />
                  ) : (
                    <div className="font-bold text-xs border-2 border-current rounded-sm w-4 h-4 flex items-center justify-center">
                      II
                    </div>
                  )}
                </button>
                <button
                  onClick={() => {
                    const t = tasks.find((x) => x.id === activeTaskId);
                    if (t) toggleTask(t.id);
                  }}
                  className="bg-green-600 text-white p-2 rounded-full hover:bg-green-500"
                >
                  <CheckCircle2 size={20} />
                </button>
                <button
                  onClick={stopTimer}
                  className="bg-red-900/50 text-red-400 p-2 rounded-full hover:bg-red-900"
                >
                  <Square size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          )}

          {view === "dashboard" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl shadow-lg mb-6 bg-slate-800 border border-slate-700">
                <div className="flex flex-col items-center justify-center border-r border-slate-700">
                  <span className="text-4xl font-bold text-white">
                    {streakData.totalContributions}
                  </span>
                  <span className="text-sm text-slate-400 mt-1">
                    Total Tasks
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full border-4 border-orange-500 flex items-center justify-center relative shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <Flame
                      className="text-orange-500 absolute -top-3 bg-slate-800 p-1"
                      size={24}
                      fill="currentColor"
                    />
                    <span className="text-3xl font-bold text-orange-500">
                      {streakData.current}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-orange-500 mt-2">
                    Day Streak
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-slate-700">
                  <span className="text-4xl font-bold text-white">
                    {streakData.longest}
                  </span>
                  <span className="text-sm text-slate-400 mt-1">
                    Best Streak
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl shadow-sm border bg-slate-800 border-slate-700 w-full overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                      <Calendar size={20} className="text-blue-500" />{" "}
                      {heatmapDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => changeHeatmapMonth(-1)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => changeHeatmapMonth(1)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  {/* FIXED: w-full with overflow handling ensures it fits nicely */}
                  <div className="w-full max-w-full overflow-x-auto">
                    <div className="grid grid-cols-7 gap-2 min-w-fit mx-auto">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                        <div
                          key={d}
                          className="text-[10px] text-center text-slate-500 font-bold w-12"
                        >
                          {d}
                        </div>
                      ))}
                      {monthGrid.map((day, i) =>
                        day ? (
                          <div
                            key={i}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-default ${getHeatmapColor(
                              day.count
                            )}`}
                            title={`${day.fullDate}: ${day.count} tasks`}
                          >
                            {day.date}
                          </div>
                        ) : (
                          <div key={i} className="w-12 h-12"></div>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* UNIFIED GRAPH SECTION: Line + Donut side-by-side if space permits */}
                  <div className="grid grid-cols-1 gap-4 h-full">
                    <div className="p-4 rounded-xl shadow-sm border bg-slate-800 border-slate-700">
                      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
                        <LineChartIcon size={16} className="text-purple-500" />{" "}
                        Trend (7 Days)
                      </h3>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyTrendData}>
                            <defs>
                              <linearGradient
                                id="colorUv"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#8b5cf6"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#8b5cf6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#334155"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              stroke="#94a3b8"
                            />
                            <YAxis
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              stroke="#94a3b8"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                borderColor: "#334155",
                              }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="tasks"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={{ r: 3, fill: "#8b5cf6" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Routine Donut */}
                      <div className="p-4 rounded-xl shadow-sm border bg-slate-800 border-slate-700 flex flex-col items-center justify-center">
                        <h3 className="text-xs font-semibold mb-2 w-full text-center text-slate-400 uppercase">
                          Routine
                        </h3>
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-slate-700"
                              strokeWidth="6"
                              fill="transparent"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-blue-500 transition-all duration-500"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray={251}
                              strokeDashoffset={
                                251 - (251 * routineStats.percent) / 100
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-lg font-bold text-white">
                              {routineStats.percent}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Focus Distribution Donut with LEGEND */}
                      <div className="p-4 rounded-xl shadow-sm border bg-slate-800 border-slate-700 flex flex-col items-center justify-center">
                        <h3 className="text-xs font-semibold mb-2 w-full text-center text-slate-400 uppercase">
                          Distribution
                        </h3>
                        <div className="w-24 h-24">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={
                                  focusDistribution.length > 0
                                    ? focusDistribution
                                    : [{ name: "None", value: 1 }]
                                }
                                innerRadius={30}
                                outerRadius={40}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell
                                  fill={
                                    focusDistribution.length > 0
                                      ? "#3b82f6"
                                      : "#334155"
                                  }
                                />
                                {focusDistribution.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      CATEGORY_COLORS[entry.name as Category] ||
                                      "#334155"
                                    }
                                  />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    {/* NEW LEGEND COMPONENT */}
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {Object.keys(CATEGORY_COLORS).map((cat) => (
                        <div key={cat} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: CATEGORY_COLORS[cat as Category],
                            }}
                          ></div>
                          <span className="text-[10px] text-slate-400">
                            {cat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl shadow-sm border mt-6 bg-slate-800 border-slate-700 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <Award className="text-yellow-500" size={20} /> Achievements
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={prevBadgeSlide}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextBadgeSlide}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {sortedBadges
                    .slice(badgeSlide * 5, (badgeSlide + 1) * 5)
                    .map((badge) => {
                      const unlocked = badge.isUnlocked(
                        tasks,
                        xp,
                        level,
                        streakData
                      );
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all relative overflow-hidden group ${
                            unlocked
                              ? "bg-slate-800 border-slate-600"
                              : "bg-slate-900 border-slate-800 opacity-60"
                          }`}
                        >
                          {!unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-[1px] z-10">
                              <div className="bg-slate-900 p-2 rounded-full border border-slate-700">
                                <LockIcon
                                  className="text-slate-500"
                                  size={16}
                                />
                              </div>
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-full mb-2 ${
                              unlocked
                                ? badge.color
                                : "bg-slate-700 text-slate-500"
                            }`}
                          >
                            <Icon size={24} />
                          </div>
                          <h4 className="font-bold text-sm text-white">
                            {badge.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {badge.description}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          {view === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Save size={20} className="text-blue-400" /> Data Management
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div>
                      <h4 className="font-bold text-white">Export Data</h4>
                      <p className="text-xs text-slate-400">
                        Download JSON backup.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Download size={16} /> Backup
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div>
                      <h4 className="font-bold text-white">Reset Progress</h4>
                      <p className="text-xs text-slate-400">
                        Clear tasks & XP.
                      </p>
                    </div>
                    <button
                      onClick={handleResetStats}
                      className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <RefreshCw size={16} /> Reset
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-red-900/10 p-6 rounded-xl border border-red-900/30">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertOctagon size={20} /> Danger Zone
                </h3>
                <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-900/30">
                  <div>
                    <h4 className="font-bold text-white">Delete Account</h4>
                    <p className="text-xs text-red-300">
                      Permanently delete account & data.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "profile" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-8 rounded-xl shadow-sm border relative overflow-hidden bg-slate-800 border-slate-700">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="absolute top-4 right-4 bg-slate-900/50 p-2 rounded-full hover:bg-slate-900 transition text-white z-10"
                >
                  <Pencil size={16} />
                </button>
                <div className="relative pt-12 flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-800 p-1 rounded-full shadow-lg">
                    <div className="w-full h-full bg-blue-900/50 rounded-full flex items-center justify-center text-blue-400 text-3xl font-bold">
                      {userProfile.displayName.charAt(0)}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mt-4 text-white">
                    {userProfile.displayName}
                  </h2>
                  {user.emailVerified ? (
                    <div className="flex items-center gap-1 text-green-400 mt-1 font-bold text-sm">
                      <BadgeCheck size={16} /> Verified
                    </div>
                  ) : (
                    <button
                      onClick={handleVerifyEmail}
                      className="mt-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded border border-yellow-600/50 hover:bg-yellow-600/30 transition"
                    >
                      Verify Email
                    </button>
                  )}
                  <p className="text-blue-400 font-medium mt-2">
                    {userProfile.profession}
                  </p>
                  <p className="text-blue-400 font-medium mt-2">
                    {email}
                  </p>
                  <div className="mt-4 flex gap-2 flex-wrap justify-center">
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold border border-slate-600">
                      {userProfile.age} Years Old
                    </span>
                    <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs font-bold border border-yellow-800">
                      Level {level}
                    </span>
                    <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-bold border border-green-800">
                      Member since {userProfile.joinedDate}
                    </span>
                  </div>
                  <div className="mt-6 w-full bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                      Current Goal
                    </h4>
                    <p className="italic text-slate-300">
                      "{userProfile.goal}"
                    </p>
                  </div>
                </div>
              </div>
              {/* PROFILE BADGE SHOWCASE */}
              <div className="p-6 rounded-xl shadow-sm border bg-slate-800 border-slate-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <Award className="text-yellow-500" size={20} /> Earned Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  {sortedBadges.filter((b) =>
                    b.isUnlocked(tasks, xp, level, streakData)
                  ).length === 0 ? (
                    <p className="text-slate-500 text-sm italic">
                      No badges earned yet. Keep going!
                    </p>
                  ) : (
                    sortedBadges
                      .filter((b) => b.isUnlocked(tasks, xp, level, streakData))
                      .map((badge) => {
                        const Icon = badge.icon;
                        return (
                          <div
                            key={badge.id}
                            className="p-2 bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-2"
                            title={badge.description}
                          >
                            <div className={`p-1 rounded-full ${badge.color}`}>
                              <Icon size={16} />
                            </div>
                            <span className="text-xs font-bold text-slate-300">
                              {badge.name}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "daily" && (
            <div className="space-y-3">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No tasks for today.
                </div>
              ) : (
                todaysTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl shadow-sm border border-l-4 flex items-center gap-4 ${
                      activeTaskId === t.id
                        ? "ring-2 ring-blue-500 bg-blue-900/20 border-blue-500"
                        : "bg-slate-800 border-slate-700"
                    } ${
                      t.category === "Work"
                        ? "border-l-blue-500"
                        : t.category === "Health"
                        ? "border-l-pink-500"
                        : t.category === "Learning"
                        ? "border-l-violet-500"
                        : t.category === "Urgent"
                        ? "border-l-red-500"
                        : "border-l-emerald-500"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={
                        t.completed
                          ? "text-green-500"
                          : "text-slate-500 hover:text-slate-300"
                      }
                    >
                      <CheckCircle2 size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium truncate ${
                          t.completed
                            ? "line-through text-slate-500"
                            : "text-white"
                        }`}
                      >
                        {t.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Category Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            CATEGORY_BG_COLORS[t.category]
                          } text-white bg-opacity-20 border border-white/10`}
                        >
                          {t.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTime12(t.startTime)} -{" "}
                          {formatTime12(t.endTime)}
                        </span>
                        {activeTaskId === t.id && (
                          <span className="text-blue-400 font-bold bg-blue-900/50 px-2 py-0.5 rounded-full flex items-center gap-1 text-xs">
                            <Clock size={10} className="animate-spin" />{" "}
                            {formatTimer(timeLeft)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!t.completed && (
                      <button
                        onClick={() => startTimer(t)}
                        className={`p-2 rounded-full transition ${
                          activeTaskId === t.id
                            ? "bg-red-900/30 text-red-400"
                            : "bg-slate-700 text-slate-400 hover:bg-blue-900/30 hover:text-blue-400"
                        }`}
                      >
                        {activeTaskId === t.id ? (
                          <Square size={18} fill="currentColor" />
                        ) : (
                          <Play size={18} fill="currentColor" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {view === "routine" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Habits</h3>
                <button
                  onClick={openAddRoutineModal}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-500 transition"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="divide-y divide-slate-700 rounded-xl shadow-sm border bg-slate-800 border-slate-700">
                {routine.map((item) => {
                  const isCompleted = (
                    routineHistory[formatDate(selectedDate)] || []
                  ).includes(item.id);
                  const IconComp = ROUTINE_ICONS[item.category] || Sun;
                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-colors hover:bg-slate-700"
                    >
                      <button
                        onClick={() => toggleRoutineItem(item.id)}
                        className={`flex-shrink-0 ${
                          isCompleted
                            ? "text-green-500"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          ROUTINE_COLORS[item.category]
                        }`}
                      >
                        <IconComp size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <h4
                            className={`font-medium truncate ${
                              isCompleted
                                ? "line-through text-slate-500"
                                : "text-white"
                            }`}
                          >
                            {item.activity}
                          </h4>
                          <span className="text-xs font-mono font-semibold bg-slate-700 px-2 py-1 rounded text-slate-400 sm:ml-4 w-fit mt-1 sm:mt-0 whitespace-nowrap">
                            {formatTime12(item.startTime)} -{" "}
                            {formatTime12(item.endTime)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditRoutineModal(item)}
                          className="text-slate-500 hover:text-blue-400"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteRoutineItem(item.id)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "calendar" && (
            <div className="space-y-8">
              {sortedMonths.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  Schedule is empty.
                </div>
              ) : (
                sortedMonths.map((group) => (
                  <div
                    key={group.month}
                    className="rounded-xl shadow-sm border overflow-hidden bg-slate-800 border-slate-700"
                  >
                    <div className="p-4 bg-slate-700 border-b border-slate-600 font-bold text-white uppercase">
                      {group.month}
                    </div>
                    <div className="divide-y divide-slate-700">
                      {group.tasks.map((t) => (
                        <div key={t.id} className="p-4 flex items-center gap-4">
                          <div className="w-12 text-center text-sm font-bold text-slate-400">
                            {new Date(t.date).getDate()}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`font-medium ${
                                t.completed
                                  ? "line-through text-slate-500"
                                  : "text-white"
                              }`}
                            >
                              {t.title}
                            </div>
                            <span className="text-xs text-slate-400">
                              {t.category}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleTask(t.id)}
                            className={
                              t.completed
                                ? "text-green-500"
                                : "text-slate-500 hover:text-slate-300"
                            }
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-white">Add Task</h2>
            <input
              className="w-full bg-slate-700 border-slate-600 text-white border p-2 rounded mb-4"
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select
                className="bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as Category)}
              >
                {Object.keys(CATEGORY_COLORS).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className="bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={formatDate(selectedDate)}
                onChange={(e) => {
                  if (
                    new Date(e.target.value) >=
                    new Date(new Date().setHours(0, 0, 0, 0))
                  )
                    setSelectedDate(new Date(e.target.value));
                  else alert("Cannot schedule tasks for past dates!");
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="time"
                className="bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={newTaskStart}
                onChange={(e) => setNewTaskStart(e.target.value)}
              />
              <input
                type="time"
                className="bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={newTaskEnd}
                onChange={(e) => setNewTaskEnd(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTaskTitle}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Routine Modal */}
      {showAddRoutineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-white">
              {editingRoutineId ? "Edit Habit" : "Add Habit"}
            </h2>
            <input
              className="w-full bg-slate-700 border-slate-600 text-white border p-2 rounded mb-4"
              placeholder="Activity Name"
              value={newRoutineActivity}
              onChange={(e) => setNewRoutineActivity(e.target.value)}
            />
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">
                Category
              </label>
              <select
                className="w-full bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={newRoutineCat}
                onChange={(e) =>
                  setNewRoutineCat(e.target.value as RoutineCategory)
                }
              >
                <option value="Focus">Focus</option>
                <option value="Health">Health</option>
                <option value="Break">Break</option>
                <option value="Sleep">Sleep</option>
                <option value="Work">Work</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="time"
                className="bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={newRoutineStart}
                onChange={(e) => setNewRoutineStart(e.target.value)}
              />
              <input
                type="time"
                className="bg-slate-700 border-slate-600 text-white border p-2 rounded"
                value={newRoutineEnd}
                onChange={(e) => setNewRoutineEnd(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddRoutineModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveRoutineItem}
                disabled={!newRoutineActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {editingRoutineId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-white">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                {nameError && (
                  <p className="text-xs text-red-400 mb-1 font-bold">
                    {nameError}
                  </p>
                )}
                <input
                  className={`w-full bg-slate-700 border ${
                    nameError ? "border-red-500" : "border-slate-600"
                  } text-white rounded-lg p-2`}
                  value={userProfile.displayName}
                  onChange={(e) => {
                    setUserProfile({
                      ...userProfile,
                      displayName: e.target.value,
                    });
                    if (e.target.value) setNameError(null);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                    type="number"
                    value={userProfile.age}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, age: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1">
                    Profession
                  </label>
                  <select
                    className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                    value={userProfile.profession}
                    onChange={(e) =>
                      setUserProfile({
                        ...userProfile,
                        profession: e.target.value,
                      })
                    }
                  >
                    {PROFESSIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                  Goal
                </label>
                <select
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                  value={userProfile.goal}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, goal: e.target.value })
                  }
                >
                  {GOAL_TYPES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveProfileUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TrackerApp />
    </ErrorBoundary>
  );
}
