// StudentRegistrationForm.tsx — Phone-only sign-in (no OTP, no email).
// Phone -> show student details from the official roster -> Continue signs them in.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Hash, IdCard, Loader2, Mail, Phone, User, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Unique app ID = slug(name) + "-" + enrollmentId — same student always gets the same id.
const buildAppId = (fullName: string, enrollmentId: string) => {
  const nameSlug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const enr = enrollmentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${nameSlug}-${enr}`;
};

// Deterministic Supabase credentials derived from the unique app ID.
const credsFor = (appId: string) => ({
  email: `${appId}@phone.campus.local`,
  password: `cc-${appId}-v1`,
});

type Student = { full_name: string; enrollment_id: string; phone_number: string };

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !session) return;
    navigate(profile?.onboarded ? "/campus" : "/onboarding", { replace: true });
  }, [session, profile, authLoading, navigate]);

  const appId = student ? buildAppId(student.full_name, student.enrollment_id) : "";
  const studentEmail = appId ? `${appId}@campus.app` : "";

  const lookupStudent = async () => {
    setError("");
    if (phoneNumber.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    setIsLoading(true);
    try {
      const { data, error: sErr } = await supabase
        .from("student1")
        .select("full_name, enrollment_id, phone_number")
        .eq("phone_number", phoneNumber)
        .maybeSingle();
      if (sErr) { setError(sErr.message); toast.error(sErr.message); return; }
      if (!data) {
        const msg = "This number is not in our college records.";
        setError(msg); toast.error(msg); return;
      }
      setStudent(data as Student);
      const { data: existing } = await supabase
        .from("registered_phones")
        .select("phone_number")
        .eq("phone_number", phoneNumber)
        .maybeSingle();
      if (existing) toast.message("You're already registered — tap Continue to sign in.");
    } finally { setIsLoading(false); }
  };

  const continueIntoApp = async () => {
    if (!student) return;
    setSigningIn(true);
    setError("");
    try {
      const id = buildAppId(student.full_name, student.enrollment_id);
      const { email, password } = credsFor(id);
      let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email, password, options: { data: { name: student.full_name } },
        });
        if (signUpErr) { setError(signUpErr.message); toast.error(signUpErr.message); return; }
        signInData = signUpData as any;
        if (!signInData?.session) {
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (retry.error) { setError(retry.error.message); toast.error(retry.error.message); return; }
          signInData = retry.data as any;
        }
      }
      const uid = signInData?.user?.id;
      if (!uid) { const m = "Sign-in failed. Please try again."; setError(m); toast.error(m); return; }

      await supabase.from("registered_phones").insert({
        phone_number: phoneNumber, full_name: student.full_name, enrollment_id: student.enrollment_id,
      });
      await supabase.from("profiles").update({ name: student.full_name }).eq("id", uid);
      await refreshProfile();

      const { data: prof } = await supabase.from("profiles").select("onboarded").eq("id", uid).maybeSingle();
      toast.success(`Welcome, ${student.full_name.split(" ")[0]}!`);
      navigate(prof?.onboarded ? "/campus" : "/onboarding", { replace: true });
    } finally { setSigningIn(false); }
  };

  const reset = () => { setStudent(null); setError(""); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Sign in to Campus Connect</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {student ? "Confirm your details to continue" : "Enter your registered phone number"}
            </p>
          </div>

          <div className="p-8 space-y-5">
            {!student && (
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

            {student && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">
                    Number verified: <span className="font-semibold">+91{phoneNumber}</span>
                  </p>
                </div>

                <Field icon={User} label="Full Name" value={student.full_name} />
                <Field icon={Hash} label="Enrollment Number" value={student.enrollment_id} />
                <Field icon={Mail} label="Student Email" value={studentEmail} />
                <Field icon={IdCard} label="Unique App ID" value={appId} mono />

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={reset} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm">Change phone</button>
                  <button onClick={continueIntoApp} disabled={signingIn} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    {signingIn ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing in…</> : <>Continue</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">Need help? Contact your college administration</p>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input value={value} readOnly disabled className={`w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium cursor-not-allowed ${mono ? "font-mono text-sm" : ""}`} />
    </div>
  </div>
);

export default StudentRegistrationForm;
