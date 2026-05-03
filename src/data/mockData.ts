export type Branch = "CSE" | "ECE" | "ME" | "EE" | "CE" | "IT";
export type Year = "1st" | "2nd" | "3rd" | "4th";
export type PlacementStatus = "Placed" | "Looking" | "Interning" | "N/A";

export interface Student {
  id: string;
  name: string;
  branch: Branch;
  year: Year;
  bio: string;
  interests: string[];
  skills: string[];
  avatar: string;
  openToMentor: boolean;
  lookingForMentorIn?: string[];
  placementStatus: PlacementStatus;
  company?: string;
  github?: string;
  linkedin?: string;
}

export interface Post {
  id: string;
  authorId: string;
  type: "update" | "question" | "achievement" | "resource";
  content: string;
  tag?: string;
  likes: number;
  comments: number;
  timestamp: string;
  pinned?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  interest: string;
  members: number;
  emoji: string;
  color: string;
}

export interface ChatThread {
  id: string;
  studentId: string;
  messages: { fromMe: boolean; text: string; time: string }[];
  unread: number;
}

export const ALL_INTERESTS = [
  "Coding", "AI/ML", "Robotics", "Web Dev", "Mobile Dev",
  "Cybersecurity", "Sports", "Music", "Photography", "Gaming",
  "Entrepreneurship", "Design", "Writing", "Finance",
];

const av = (seed: string) => `https://i.pravatar.cc/300?u=${seed}`;

export const currentUser: Student = {
  id: "me",
  name: "Aarav Sharma",
  branch: "CSE",
  year: "2nd",
  bio: "Building side projects in React + exploring ML. Always down to collaborate.",
  interests: ["Coding", "Web Dev", "AI/ML", "Entrepreneurship"],
  skills: ["React", "TypeScript", "Python"],
  avatar: av("aarav"),
  openToMentor: false,
  lookingForMentorIn: ["Placement Prep", "System Design"],
  placementStatus: "N/A",
  github: "aaravs",
  linkedin: "aaravs",
};

export const students: Student[] = [
  {
    id: "s1", name: "Priya Menon", branch: "CSE", year: "4th",
    bio: "SWE intern @ Google. Love teaching juniors about DSA & system design.",
    interests: ["Coding", "AI/ML", "Web Dev"],
    skills: ["DSA", "System Design", "Go", "React"],
    avatar: av("priya"), openToMentor: true,
    placementStatus: "Placed", company: "Google",
    github: "priyam", linkedin: "priyam",
  },
  {
    id: "s2", name: "Rohan Kapoor", branch: "ECE", year: "4th",
    bio: "Robotics lead. Built a self-driving RC car. Open to mentor on embedded.",
    interests: ["Robotics", "AI/ML", "Coding"],
    skills: ["Embedded C", "ROS", "PCB Design"],
    avatar: av("rohan"), openToMentor: true,
    placementStatus: "Placed", company: "Qualcomm",
  },
  {
    id: "s3", name: "Ananya Iyer", branch: "CSE", year: "3rd",
    bio: "Frontend dev & UI nerd. Currently learning Three.js.",
    interests: ["Web Dev", "Design", "Photography"],
    skills: ["React", "Figma", "Tailwind"],
    avatar: av("ananya"), openToMentor: false,
    placementStatus: "Interning", company: "Razorpay",
  },
  {
    id: "s4", name: "Karthik Reddy", branch: "CSE", year: "2nd",
    bio: "Competitive programmer. Codeforces Expert. Looking for hackathon team.",
    interests: ["Coding", "Gaming"],
    skills: ["C++", "Python", "Algorithms"],
    avatar: av("karthik"), openToMentor: false,
    placementStatus: "N/A",
  },
  {
    id: "s5", name: "Sneha Patil", branch: "IT", year: "4th",
    bio: "Backend engineer. Cloud & distributed systems. Happy to review resumes.",
    interests: ["Coding", "Cybersecurity", "Entrepreneurship"],
    skills: ["Node.js", "AWS", "Docker"],
    avatar: av("sneha"), openToMentor: true,
    placementStatus: "Placed", company: "Amazon",
  },
  {
    id: "s6", name: "Vikram Joshi", branch: "ME", year: "3rd",
    bio: "Formula Student team. CAD + simulation. Also play guitar.",
    interests: ["Robotics", "Music", "Sports"],
    skills: ["SolidWorks", "ANSYS", "MATLAB"],
    avatar: av("vikram"), openToMentor: false,
    placementStatus: "Looking",
  },
  {
    id: "s7", name: "Meera Krishnan", branch: "CSE", year: "3rd",
    bio: "ML researcher in training. Published a paper on NLP last sem.",
    interests: ["AI/ML", "Coding", "Writing"],
    skills: ["PyTorch", "NLP", "Research"],
    avatar: av("meera"), openToMentor: true,
    placementStatus: "Interning", company: "Microsoft Research",
  },
  {
    id: "s8", name: "Arjun Nair", branch: "ECE", year: "2nd",
    bio: "Photography club. Building a drone from scratch.",
    interests: ["Photography", "Robotics", "Gaming"],
    skills: ["Lightroom", "Arduino"],
    avatar: av("arjun"), openToMentor: false,
    placementStatus: "N/A",
  },
  {
    id: "s9", name: "Riya Bansal", branch: "CSE", year: "4th",
    bio: "Founded a campus startup. Now at a YC company. Ask me about entrepreneurship.",
    interests: ["Entrepreneurship", "Web Dev", "Design"],
    skills: ["Product", "Next.js", "Pitching"],
    avatar: av("riya"), openToMentor: true,
    placementStatus: "Placed", company: "Stripe",
  },
  {
    id: "s10", name: "Devendra Singh", branch: "EE", year: "3rd",
    bio: "Power systems + renewables. IEEE chapter member.",
    interests: ["Robotics", "Sports"],
    skills: ["MATLAB", "Power Electronics"],
    avatar: av("dev"), openToMentor: false,
    placementStatus: "Looking",
  },
  {
    id: "s11", name: "Tara Ghosh", branch: "IT", year: "2nd",
    bio: "Indie game dev. Unity + pixel art. Always cooking new ideas.",
    interests: ["Gaming", "Design", "Coding"],
    skills: ["Unity", "C#", "Aseprite"],
    avatar: av("tara"), openToMentor: false,
    placementStatus: "N/A",
  },
  {
    id: "s12", name: "Harsh Vora", branch: "CSE", year: "4th",
    bio: "Cybersec enthusiast. CTF player. Top 3 at Inter-IIT.",
    interests: ["Cybersecurity", "Coding"],
    skills: ["Pentesting", "Linux", "Crypto"],
    avatar: av("harsh"), openToMentor: true,
    placementStatus: "Placed", company: "Palo Alto Networks",
  },
];

export const posts: Post[] = [
  {
    id: "p0", authorId: "s9", type: "achievement", pinned: true,
    content: "🎉 Campus Hackathon 2026 registrations are OPEN! 48-hour build with ₹1L prize pool. Form teams via Discover →",
    tag: "Announcement", likes: 142, comments: 28, timestamp: "Pinned",
  },
  {
    id: "p1", authorId: "s1", type: "achievement",
    content: "Just accepted my full-time SWE offer from Google! Happy to share interview prep resources — DM me 🚀",
    tag: "Placement", likes: 312, comments: 47, timestamp: "2h",
  },
  {
    id: "p2", authorId: "s7", type: "resource",
    content: "Sharing my curated NLP roadmap for beginners. Covers transformers, fine-tuning, and 5 hands-on projects.",
    tag: "AI/ML", likes: 89, comments: 12, timestamp: "5h",
  },
  {
    id: "p3", authorId: "s4", type: "question",
    content: "Looking for 2 teammates for Smart India Hackathon. Need a backend dev and someone with ML experience. Theme: EdTech.",
    tag: "Hackathon", likes: 24, comments: 9, timestamp: "8h",
  },
  {
    id: "p4", authorId: "s2", type: "update",
    content: "Robotics club demo day this Friday at 5pm in the Mech lab. We're showing the autonomous navigation rover. Come through!",
    tag: "Event", likes: 67, comments: 14, timestamp: "1d",
  },
  {
    id: "p5", authorId: "s11", type: "achievement",
    content: "My first indie game just hit 1000 downloads on itch.io 🎮 Built in 3 weeks with Unity. AMA!",
    tag: "Gaming", likes: 156, comments: 31, timestamp: "1d",
  },
  {
    id: "p6", authorId: "s12", type: "resource",
    content: "Hosting a free CTF workshop next Saturday. Beginners welcome. We'll cover web exploitation basics.",
    tag: "Cybersecurity", likes: 78, comments: 18, timestamp: "2d",
  },
];

export const communities: Community[] = [
  { id: "c1", name: "AI/ML Enthusiasts", description: "Papers, projects & study groups for ML learners.", interest: "AI/ML", members: 284, emoji: "🤖", color: "from-violet-500 to-fuchsia-500" },
  { id: "c2", name: "Competitive Programming", description: "Daily problems, contest discussions, ICPC prep.", interest: "Coding", members: 412, emoji: "⚡", color: "from-amber-500 to-orange-500" },
  { id: "c3", name: "Web Dev Hub", description: "Frontend, backend, fullstack — all things web.", interest: "Web Dev", members: 356, emoji: "🌐", color: "from-sky-500 to-cyan-500" },
  { id: "c4", name: "Robotics Club", description: "Build, break, learn. Hardware hackers welcome.", interest: "Robotics", members: 178, emoji: "🦾", color: "from-rose-500 to-red-500" },
  { id: "c5", name: "Placement Prep 2026", description: "Interview experiences, OA discussions, referrals.", interest: "Coding", members: 521, emoji: "🎯", color: "from-emerald-500 to-teal-500" },
  { id: "c6", name: "Founders Circle", description: "Student entrepreneurs sharing wins, struggles, intros.", interest: "Entrepreneurship", members: 96, emoji: "🚀", color: "from-indigo-500 to-purple-500" },
  { id: "c7", name: "Photography Society", description: "Campus shoots, gear talk, monthly themes.", interest: "Photography", members: 134, emoji: "📸", color: "from-pink-500 to-rose-500" },
  { id: "c8", name: "Cybersec & CTF", description: "Capture the flag, write-ups, security news.", interest: "Cybersecurity", members: 88, emoji: "🛡️", color: "from-slate-700 to-slate-900" },
];

export const chats: ChatThread[] = [
  {
    id: "t1", studentId: "s1", unread: 2,
    messages: [
      { fromMe: true, text: "Hi senior! Loved your post on system design. Mind if I ask a few questions?", time: "10:32" },
      { fromMe: false, text: "Hey! Of course, ask away 🙂", time: "10:45" },
      { fromMe: false, text: "I'm hosting a small group session this Sunday too if you wanna join.", time: "10:46" },
    ],
  },
  {
    id: "t2", studentId: "s7", unread: 0,
    messages: [
      { fromMe: false, text: "Saw you're into ML — want to collab on a Kaggle comp?", time: "Yesterday" },
      { fromMe: true, text: "Yes! Send me the details 🔥", time: "Yesterday" },
    ],
  },
  {
    id: "t3", studentId: "s4", unread: 1,
    messages: [
      { fromMe: false, text: "Bro you in for SIH? I need a frontend person.", time: "2d" },
    ],
  },
];

export const iceBreakers = [
  "Hi! I saw you're into {interest}. I'm exploring it too — would love to chat!",
  "Hey senior! Could I ask you about {interest}?",
  "Interested in collaborating on a {interest} project?",
  "Loved your profile! How did you get started with {interest}?",
];

export const findStudent = (id: string) =>
  id === "me" ? currentUser : students.find((s) => s.id === id)!;