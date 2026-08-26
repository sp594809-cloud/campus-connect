/** Native Python Mastery course — content loaded from the python repo (GitHub raw). */

export type CourseModule = {
  id: string;
  title: string;
  file: string;
  weeks: string;
  icon: string;
  gradient: string;
  topics: string[];
};

/** Module metadata (mirrors python-course-app). Content files stay in sp594809-cloud/python. */
export const PYTHON_MODULES: CourseModule[] = [
  {
    id: "01",
    title: "Python Basics",
    file: "module-01-basics.md",
    weeks: "Week 1–2",
    icon: "🐍",
    gradient: "from-green-500 to-emerald-600",
    topics: ["Variables", "Types", "Strings", "I/O", "Operators"],
  },
  {
    id: "02",
    title: "Control Flow",
    file: "module-02-control-flow.md",
    weeks: "Week 3–4",
    icon: "🔀",
    gradient: "from-blue-500 to-cyan-600",
    topics: ["if/else", "Loops", "break/continue"],
  },
  {
    id: "03",
    title: "Data Structures",
    file: "module-03-data-structures.md",
    weeks: "Week 5–6",
    icon: "📊",
    gradient: "from-purple-500 to-pink-600",
    topics: ["Lists", "Dicts", "Sets", "Tuples"],
  },
  {
    id: "04",
    title: "Functions",
    file: "module-04-functions.md",
    weeks: "Week 7–8",
    icon: "⚙️",
    gradient: "from-orange-500 to-red-600",
    topics: ["def", "args", "lambda", "scope"],
  },
  {
    id: "05",
    title: "Object-Oriented Programming",
    file: "module-05-oop.md",
    weeks: "Week 9–10",
    icon: "🏗️",
    gradient: "from-indigo-500 to-purple-600",
    topics: ["Classes", "Inheritance", "Magic methods"],
  },
  {
    id: "06",
    title: "Advanced Python",
    file: "module-06-advanced.md",
    weeks: "Week 11–12",
    icon: "🚀",
    gradient: "from-pink-500 to-rose-600",
    topics: ["Comprehensions", "Generators", "Exceptions"],
  },
  {
    id: "07",
    title: "Data Science Tools",
    file: "module-07-data-science.md",
    weeks: "Week 13–14",
    icon: "📈",
    gradient: "from-yellow-500 to-amber-600",
    topics: ["NumPy", "Pandas", "Plotting"],
  },
  {
    id: "08",
    title: "Web Development",
    file: "module-08-web.md",
    weeks: "Week 15–16",
    icon: "🌐",
    gradient: "from-teal-500 to-cyan-600",
    topics: ["Flask", "APIs", "HTTP"],
  },
  {
    id: "09",
    title: "Automation & Scripting",
    file: "module-09-automation.md",
    weeks: "Week 17–18",
    icon: "🤖",
    gradient: "from-red-500 to-orange-600",
    topics: ["Files", "OS", "Scheduling"],
  },
  {
    id: "10",
    title: "Real-World & Best Practices",
    file: "module-10-best-practices.md",
    weeks: "Week 19–24",
    icon: "🎓",
    gradient: "from-violet-500 to-purple-600",
    topics: ["Testing", "Packaging", "Style"],
  },
];

const CONTENT_BASE =
  "https://raw.githubusercontent.com/sp594809-cloud/python/main/python-course-app/content";

const PROGRESS_KEY = "campus-python-progress";

export function getModule(id: string): CourseModule | undefined {
  return PYTHON_MODULES.find((m) => m.id === id);
}

export function adjacentModules(id: string): {
  prev: CourseModule | null;
  next: CourseModule | null;
} {
  const idx = PYTHON_MODULES.findIndex((m) => m.id === id);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? PYTHON_MODULES[idx - 1] : null,
    next: idx < PYTHON_MODULES.length - 1 ? PYTHON_MODULES[idx + 1] : null,
  };
}

/** Fetch module markdown from the python repo (cached by browser / PWA). */
export async function fetchModuleMarkdown(file: string): Promise<string> {
  const url = `${CONTENT_BASE}/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load module (${res.status}). Check network or GitHub content.`);
  }
  return res.text();
}

export type ProgressMap = Record<string, boolean>;

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

export function markModuleDone(moduleId: string): ProgressMap {
  const map = loadProgress();
  map[moduleId] = true;
  saveProgress(map);
  return map;
}

export function completedCount(map: ProgressMap = loadProgress()): number {
  return PYTHON_MODULES.filter((m) => map[m.id]).length;
}

/** Extract lesson headings from markdown (## 📘 LESSON x.y). */
export function extractLessons(md: string): { id: string; title: string }[] {
  const re = /##\s+📘\s+LESSON\s+(\d+\.\d+):\s*(.+?)(?:\n|$)/g;
  const out: { id: string; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    out.push({ id: m[1], title: m[2].trim() });
  }
  return out;
}
