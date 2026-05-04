// StudentRegistrationForm.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Hash, Loader2, Phone, ShieldCheck, User, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
type Step = "phone" | "otp" | "confirm";

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("register");
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedTo, setMaskedTo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    const session = getStudentSession();
    if (session) {
      navigate(session.onboarded ? "/campus" : "/onboarding", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async () => {
    setError("");
    if (phoneNumber.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", { body: { phone_number: phoneNumber, mode } });
      if (error || (data as any)?.error) {
        const msg = (data as any)?.error || error?.message || "Failed to send OTP";
        setError(msg); toast.error(msg); return;
      }
      setMaskedTo((data as any)?.masked ?? "");
      setStep("otp");
      setResendIn(30);
      toast.success("OTP sent!");
    } finally { setIsLoading(false); }
  };

  const verifyOtp = async () => {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", { body: { phone_number: phoneNumber, code: otp, mode } });
      if (error || (data as any)?.error) {
        const msg = (data as any)?.error || error?.message || "Verification failed";
        setError(msg); toast.error(msg); return;
      }
      const student = (data as any).student;
      setFullName(student.full_name);
      setEnrollmentId(student.enrollment_id);
      setStep("confirm");
      toast.success("Verified!");
    } finally { setIsLoading(false); }
  };

  const completeLogin = () => {
    const session: StudentSession = {
      full_name: fullName,
      enrollment_id: enrollmentId,
      phone_number: phoneNumber,
      loggedInAt: new Date().toISOString(),
      onboarded: mode === "login", // login → already onboarded; register → go through onboarding
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    toast.success(`Welcome, ${fullName.split(" ")[0]}!`);
    navigate(mode === "login" ? "/campus" : "/onboarding", { replace: true });
  };

  const switchMode = (m: Mode) => {
    setMode(m); setStep("phone"); setOtp(""); setError(""); setFullName(""); setEnrollmentId("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{mode === "register" ? "Student Registration" : "Welcome back"}</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {step === "phone" && "Enter your phone number to get started"}
              {step === "otp" && `We sent a 6-digit code to ${maskedTo}`}
              {step === "confirm" && "Confirm your details"}
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
                <button onClick={sendOtp} disabled={isLoading || phoneNumber.length < 10} className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : <>Send OTP</>}
                </button>
              </div>
            )}

            {step === "otp" && (
              <div>
                <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-3"><ArrowLeft className="h-3.5 w-3.5" /> Change number</button>
                <label className="block text-sm font-semibold text-gray-700 mb-2">6-digit code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    placeholder="••••••"
                    maxLength={6}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all tracking-[0.5em] text-center text-lg font-bold ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"}`}
                  />
                </div>
                {error && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
                <button onClick={verifyOtp} disabled={isLoading || otp.length !== 6} className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</> : "Verify"}
                </button>
                <button onClick={sendOtp} disabled={resendIn > 0 || isLoading} className="mt-3 w-full text-sm font-semibold text-indigo-600 disabled:text-gray-400">
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">Phone verified successfully!</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input value={fullName} readOnly className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input value={enrollmentId} readOnly className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium" />
                  </div>
                </div>
                <button onClick={completeLogin} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md">
                  {mode === "register" ? "Complete Registration" : "Log in"}
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
