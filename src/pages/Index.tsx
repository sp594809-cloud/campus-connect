// StudentRegistrationForm.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Hash, Loader2, Mail, Phone, User, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "campus_student_session";

export type StudentSession = {
  full_name: string;
  enrollment_id: string;
  phone_number: string;
  loggedInAt: string;
  onboarded?: boolean;
  bio?: string;
  branch?: string;
  year?: string;
  interests?: string[];
  skills?: string[];
  open_to_mentor?: boolean;
  looking_for_mentor_in?: string;
};

export const getStudentSession = (): StudentSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StudentSession) : null;
  } catch {
    return null;
  }
};

type Mode = "register" | "login";
type Step = "phone" | "email" | "otp";

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("register");
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [defaultEmail, setDefaultEmail] = useState("");
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    const session = getStudentSession();
    if (session) {
      navigate(session.onboarded ? "/campus" : "/onboarding", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendOtpToEmail = (email: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(code);
    setResendIn(30);
    // Mock email send — replace with real email service later.
    console.log(`[MOCK EMAIL OTP] To: ${email} | Code: ${code}`);
    toast.success(`Verification code sent to ${email}`);
  };

  const lookupStudent = async () => {
    setError("");
    if (phoneNumber.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    setIsLoading(true);
    try {
      const { data: student, error: sErr } = await supabase
        .from("student1")
        .select("full_name, enrollment_id, phone_number")
        .eq("phone_number", phoneNumber)
        .maybeSingle();
      if (sErr) { setError(sErr.message); toast.error(sErr.message); return; }
      if (!student) {
        const msg = "This number is not in our college records.";
        setError(msg); toast.error(msg); return;
      }

      const { data: reg } = await supabase
        .from("registered_phones")
        .select("phone_number")
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (mode === "register" && reg) {
        const msg = "This number is already registered. Please log in instead.";
        setError(msg); toast.error(msg); return;
      }
      if (mode === "login" && !reg) {
        const msg = "No account found for this number. Please register first.";
        setError(msg); toast.error(msg); return;
      }

      setFullName(student.full_name);
      setEnrollmentId(student.enrollment_id);
      const email = `${student.enrollment_id}@mail.ljku.edu.in`;
      setDefaultEmail(email);
      setGeneratedEmail(email);
      setUseCustomEmail(false);
      setCustomEmail("");
      setOtpInput("");
      setStep("email");
    } finally { setIsLoading(false); }
  };

  const confirmEmailAndSend = () => {
    setError("");
    const email = useCustomEmail ? customEmail.trim() : defaultEmail;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      const m = "Enter a valid email address.";
      setError(m); toast.error(m); return;
    }
    setGeneratedEmail(email);
    setOtpInput("");
    sendOtpToEmail(email);
    setStep("otp");
  };

  const completeLogin = async () => {
    setError("");
    if (otpInput.length !== 6 || otpInput !== sentOtp) {
      const m = "Invalid verification code. Please try again.";
      setError(m); toast.error(m); return;
    }
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        const m = "You must be signed in. Please log in and try again.";
        setError(m); toast.error(m);
        navigate("/auth", { replace: true });
        return;
      }

      if (mode === "register") {
        // Block duplicates: enrollment_id is unique, phone_number is PK.
        const { error: regErr } = await supabase
          .from("registered_phones")
          .insert({ phone_number: phoneNumber, full_name: fullName, enrollment_id: enrollmentId });
        if (regErr) {
          // 23505 = unique_violation
          if ((regErr as any).code === "23505") {
            const m = "This student is already registered. Please log in instead.";
            setError(m); toast.error(m); return;
          }
          setError(regErr.message); toast.error(regErr.message); return;
        }
      }

      // Sync the official roster name onto the user's profile so posts always show the right name.
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ name: fullName })
        .eq("id", uid);
      if (profErr) console.warn("profile name sync failed", profErr);

      const session: StudentSession = {
        full_name: fullName,
        enrollment_id: enrollmentId,
        phone_number: phoneNumber,
        loggedInAt: new Date().toISOString(),
        onboarded: mode === "login",
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      toast.success(`Welcome, ${fullName.split(" ")[0]}!`);
      navigate(mode === "login" ? "/campus" : "/onboarding", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m); setStep("phone"); setError(""); setFullName(""); setEnrollmentId("");
    setGeneratedEmail(""); setDefaultEmail(""); setCustomEmail(""); setUseCustomEmail(false);
    setSentOtp(""); setOtpInput("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{mode === "register" ? "Student Registration" : "Welcome back"}</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {step === "phone" && "Step 1 of 3 — Verify your phone number"}
              {step === "email" && "Step 2 of 3 — Choose your email"}
              {step === "otp" && "Step 3 of 3 — Enter verification code"}
            </p>
          </div>

          <div className="p-8 space-y-5">
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-sm font-semibold">
              <button onClick={() => switchMode("register")} className={`py-2 rounded-lg transition-all ${mode === "register" ? "bg-white shadow text-indigo-700" : "text-gray-500"}`}>Register</button>
              <button onClick={() => switchMode("login")} className={`py-2 rounded-lg transition-all ${mode === "login" ? "bg-white shadow text-indigo-700" : "text-gray-500"}`}>Log in</button>
            </div>

            {step === "phone" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                    placeholder="10-digit number"
                    maxLength={10}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"}`}
                  />
                </div>
                {error && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
                <button onClick={lookupStudent} disabled={isLoading || phoneNumber.length < 10} className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Checking…</> : <>Continue</>}
                </button>
              </div>
            )}

            {step === "email" && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    Hi {fullName.split(" ")[0]}! Where should we send your verification code?
                  </p>
                </div>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${!useCustomEmail ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                    <input type="radio" name="email-choice" checked={!useCustomEmail} onChange={() => { setUseCustomEmail(false); setError(""); }} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">College email (recommended)</div>
                      <div className="text-xs text-gray-600 truncate">{defaultEmail}</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${useCustomEmail ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                    <input type="radio" name="email-choice" checked={useCustomEmail} onChange={() => { setUseCustomEmail(true); setError(""); }} className="mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">Use my own email</div>
                      <div className="text-xs text-gray-600">Enter a personal email below</div>
                    </div>
                  </label>
                </div>
                {useCustomEmail && (
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => { setCustomEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"}`}
                    />
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
                <button onClick={confirmEmailAndSend} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md">
                  Send verification code
                </button>
                <button type="button" onClick={() => setStep("phone")} className="w-full text-xs font-semibold text-gray-500 hover:text-gray-700">
                  ← Change phone number
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    Verification code sent to <span className="font-semibold">{generatedEmail}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name (locked)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input value={fullName} readOnly disabled className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your name is fixed from official college records and cannot be edited.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input value={enrollmentId} readOnly disabled className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    placeholder="••••••"
                    maxLength={6}
                    className={`w-full px-4 py-3 border-2 rounded-xl tracking-[0.5em] text-center text-lg font-bold focus:outline-none focus:ring-2 transition-all ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"}`}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      onClick={() => sendOtpToEmail(generatedEmail)}
                      disabled={resendIn > 0}
                      className="text-xs font-semibold text-indigo-600 disabled:text-gray-400"
                    >
                      {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                    </button>
                    <button type="button" onClick={() => setStep("phone")} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                      Change phone
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
                <button onClick={completeLogin} disabled={isLoading || otpInput.length !== 6} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</> : (mode === "register" ? "Complete Registration" : "Log in")}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">Need help? Contact your college administration</p>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;
