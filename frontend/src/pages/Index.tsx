// Phone sign-in for students, gated by a real SMS OTP (sent via TextBee).
// The edge functions own code generation, verification and session creation.
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Hash, IdCard, Loader2, Phone, ShieldCheck, User, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const RESEND_SECONDS = 30;

const buildAppId = (fullName: string, enrollmentId: string) => {
  const nameSlug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const enr = enrollmentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${nameSlug}-${enr}`;
};

type Student = { full_name: string; enrollment_id: string; phone_number: string };
type Step = "phone" | "confirm" | "otp";

const errorFrom = async (error: unknown, fallback: string) => {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.clone().json();
      if (body?.error) return String(body.error);
    } catch {
      /* ignore */
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading || !session) return;
    navigate(profile?.onboarded ? "/campus" : "/onboarding", { replace: true });
  }, [session, profile, authLoading, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  const appId = student ? buildAppId(student.full_name, student.enrollment_id) : "";

  const lookupStudent = async () => {
    setError("");
    if (!PHONE_REGEX.test(phoneNumber)) {
      setError("Enter a valid 10-digit Indian mobile number (starting with 6-9)");
      return;
    }
    setIsLoading(true);
    try {
      const { data: rows, error: sErr } = await supabase.rpc("lookup_student_by_phone", { _phone: phoneNumber });
      const data = Array.isArray(rows) ? rows[0] ?? null : null;
      if (sErr) { setError(sErr.message); toast.error(sErr.message); return; }
      if (!data) {
        const msg = "This number is not in our college records.";
        setError(msg); toast.error(msg); return;
      }
      setStudent(data as Student);
      setStep("confirm");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lookup failed. Please try again.";
      setError(msg); toast.error(msg);
    } finally { setIsLoading(false); }
  };

  const sendCode = async () => {
    setBusy(true);
    setError("");
    try {
      const { error: fnErr } = await supabase.functions.invoke("send-otp", { body: { phone: phoneNumber } });
      if (fnErr) {
        const msg = await errorFrom(fnErr, "Couldn't send the code. Please try again.");
        setError(msg); toast.error(msg); return;
      }
      setCode("");
      setStep("otp");
      setCooldown(RESEND_SECONDS);
      toast.success(`Code sent to +91${phoneNumber}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't send the code. Please try again.";
      setError(msg); toast.error(msg);
    } finally { setBusy(false); }
  };

  const verifyCode = async (value: string) => {
    if (!student) return;
    setBusy(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("verify-otp", {
        body: { phone: phoneNumber, code: value },
      });
      if (fnErr) {
        const msg = await errorFrom(fnErr, "Verification failed. Please try again.");
        setError(msg); toast.error(msg); setCode(""); return;
      }
      const payload = data as { access_token?: string; refresh_token?: string; full_name?: string };
      if (!payload?.access_token || !payload?.refresh_token) {
        const msg = "Verification failed. Please request a new code.";
        setError(msg); toast.error(msg); return;
      }

      const { error: sessErr } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (sessErr) { setError(sessErr.message); toast.error(sessErr.message); return; }

      await refreshProfile();
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const { data: prof } = uid
        ? await supabase.from("profiles").select("onboarded").eq("id", uid).maybeSingle()
        : { data: null };

      toast.success(`Welcome, ${(payload.full_name ?? student.full_name).split(" ")[0]}!`);
      navigate(prof?.onboarded ? "/campus" : "/onboarding", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed. Please try again.";
      setError(msg); toast.error(msg);
    } finally { setBusy(false); }
  };

  const reset = () => { setStudent(null); setError(""); setCode(""); setStep("phone"); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-hero px-8 py-8">
            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              Your Campus.<br />Your Network.<br />Your Opportunities.
            </h1>
            <p className="text-indigo-100 text-sm mt-3">
              {step === "phone" && "Sign in with your registered phone number"}
              {step === "confirm" && "Confirm your details to get a verification code"}
              {step === "otp" && `Enter the 6-digit code sent to +91${phoneNumber}`}
            </p>
          </div>

          <div className="p-8 space-y-5">
            {step === "phone" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value.trim().replace(/\D/g, "").slice(0, 10)); setError(""); }}
                    placeholder="10-digit number"
                    maxLength={10}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"}`}
                  />
                </div>
                {error && <ErrorNote text={error} />}
                <button onClick={lookupStudent} disabled={isLoading || !PHONE_REGEX.test(phoneNumber)} className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
                  {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Checking…</> : <>Continue</>}
                </button>
              </div>
            )}

            {step === "confirm" && student && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    Found in records: <span className="font-semibold">+91{phoneNumber}</span>
                  </p>
                </div>

                <Field icon={User} label="Full Name" value={student.full_name} />
                <Field icon={Hash} label="Enrollment Number" value={student.enrollment_id} />
                <Field icon={IdCard} label="Unique App ID" value={appId} mono />

                {error && <ErrorNote text={error} />}

                <div className="flex gap-2">
                  <button onClick={reset} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm">Change phone</button>
                  <button onClick={sendCode} disabled={busy} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : <><ShieldCheck className="h-5 w-5" /> Send OTP</>}
                  </button>
                </div>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <button onClick={() => { setStep("confirm"); setError(""); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="flex justify-center py-2">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(v) => {
                      setCode(v);
                      setError("");
                      if (v.length === 6 && !busy) void verifyCode(v);
                    }}
                    disabled={busy}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-11 rounded-xl border-2 border-gray-200 text-lg font-semibold" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && <ErrorNote text={error} />}

                <button
                  onClick={() => verifyCode(code)}
                  disabled={busy || code.length !== 6}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</> : <>Verify & continue</>}
                </button>

                <button
                  onClick={sendCode}
                  disabled={busy || cooldown > 0}
                  className="w-full text-sm font-semibold text-indigo-600 disabled:text-gray-400"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
                <p className="text-center text-xs text-gray-400">The code expires in 5 minutes.</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">Need help? Contact your college administration</p>
      </div>
    </div>
  );
};

const ErrorNote = ({ text }: { text: string }) => (
  <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-red-700 font-medium">{text}</p>
  </div>
);

const Field = ({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input value={value} readOnly disabled className={`w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium cursor-not-allowed ${mono ? "font-mono text-sm" : ""}`} />
    </div>
  </div>
);

export default StudentRegistrationForm;
