// StudentRegistrationForm.tsx — Phone OTP via Firebase, then auto-sign-in to Lovable Cloud
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Hash, Loader2, Phone, User, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth as firebaseAuth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

// Deterministic Supabase credentials so the same student always lands on the same auth user.
const credsFor = (enrollmentId: string, phoneNumber: string) => ({
  email: `${enrollmentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@phone.campus.local`,
  password: `cc-${phoneNumber}-${enrollmentId}-v1`,
});

type Mode = "register" | "login";
type Step = "phone" | "otp";

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();
  const [mode, setMode] = useState<Mode>("register");
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const ensureRecaptcha = () => {
    const w = window as any;
    if (!w._recaptchaVerifier) {
      w._recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return w._recaptchaVerifier as RecaptchaVerifier;
  };

  const sendSmsOtp = async () => {
    try {
      const verifier = ensureRecaptcha();
      const e164 = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const conf = await signInWithPhoneNumber(firebaseAuth, e164, verifier);
      setConfirmation(conf);
      setResendIn(30);
      toast.success(`SMS code sent to ${e164}`);
      return true;
    } catch (e: any) {
      const msg = e?.message || "Failed to send SMS code";
      toast.error(msg);
      setError(msg);
      return false;
    }
  };

  // Session-aware redirect: if a Supabase user is already signed in, route them.
  useEffect(() => {
    if (authLoading) return;
    if (!session) return;
    navigate(profile?.onboarded ? "/campus" : "/onboarding", { replace: true });
  }, [session, profile, authLoading, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

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
      setOtpInput("");
      // Send the SMS immediately, then move to OTP entry.
      const ok = await sendSmsOtp();
      if (ok) setStep("otp");
    } finally { setIsLoading(false); }
  };

  const completeLogin = async () => {
    setError("");
    if (otpInput.length !== 6) {
      const m = "Enter the 6-digit code.";
      setError(m); toast.error(m); return;
    }
    setIsLoading(true);
    try {
      // 1) Verify the SMS code with Firebase.
      if (!confirmation) {
        const m = "Please request an SMS code first.";
        setError(m); toast.error(m); return;
      }
      try {
        await confirmation.confirm(otpInput);
      } catch {
        const m = "Invalid SMS verification code.";
        setError(m); toast.error(m); return;
      }
      // We don't need the Firebase session afterwards.
      try { await firebaseAuth.signOut(); } catch { /* ignore */ }

      // 2) Sign into Lovable Cloud with deterministic creds (sign-in, fallback to sign-up).
      const { email, password } = credsFor(enrollmentId, phoneNumber);
      let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: fullName } },
        });
        if (signUpErr) {
          setError(signUpErr.message); toast.error(signUpErr.message); return;
        }
        signInData = signUpData as any;
        // Some setups still need an explicit sign-in even with auto-confirm on.
        if (!signInData?.session) {
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (retry.error) { setError(retry.error.message); toast.error(retry.error.message); return; }
          signInData = retry.data as any;
        }
      }
      const uid = signInData?.user?.id;
      if (!uid) {
        const m = "Sign-in failed. Please try again.";
        setError(m); toast.error(m); return;
      }

      if (mode === "register") {
        const { error: regErr } = await supabase
          .from("registered_phones")
          .insert({ phone_number: phoneNumber, full_name: fullName, enrollment_id: enrollmentId });
        if (regErr && (regErr as any).code !== "23505") {
          console.warn("registered_phones insert failed", regErr);
        }
      }

      // Sync the official roster name onto the user's profile so posts always show the right name.
      await supabase.from("profiles").update({ name: fullName }).eq("id", uid);
      await refreshProfile();

      // Decide where to send the user based on their actual onboarding status in the DB.
      const { data: prof } = await supabase
        .from("profiles").select("onboarded").eq("id", uid).maybeSingle();

      toast.success(`Welcome, ${fullName.split(" ")[0]}!`);
      navigate(prof?.onboarded ? "/campus" : "/onboarding", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m); setStep("phone"); setError(""); setFullName(""); setEnrollmentId("");
    setOtpInput(""); setConfirmation(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{mode === "register" ? "Student Registration" : "Welcome back"}</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {step === "phone" && "Step 1 — Verify your phone number"}
              {step === "otp" && "Step 2 — Enter the SMS code"}
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

            {step === "otp" && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    SMS code sent to <span className="font-semibold">+91{phoneNumber}</span>
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
                      onClick={() => sendSmsOtp()}
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
        <div id="recaptcha-container" />
      </div>
    </div>
  );
};

export default StudentRegistrationForm;
