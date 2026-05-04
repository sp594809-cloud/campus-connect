// StudentRegistrationForm.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, User, Phone, Hash } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const SESSION_KEY = "campus_student_session";

export type StudentSession = {
  full_name: string;
  enrollment_id: string;
  phone_number: string;
  loggedInAt: string;
};

export const getStudentSession = (): StudentSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StudentSession) : null;
  } catch {
    return null;
  }
};

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Persistence: if already logged in, skip registration
  useEffect(() => {
    const session = getStudentSession();
    if (session) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setPhoneNumber(value);

    // Reset verification state when user modifies phone number
    if (isVerified) {
      setIsVerified(false);
      setFullName("");
      setEnrollmentId("");
      setError("");
    }
  };

  const verifyPhoneNumber = async () => {
    // Validate phone number format
    if (phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Query Supabase for the phone number
      const { data, error: queryError } = await supabase
        .from("student1")
        .select("full_name, enrollment_id, phone_number")
        .eq("phone_number", phoneNumber)
        .maybeSingle(); // Use maybeSingle() to handle 0 or 1 results

      if (queryError) {
        console.error("Supabase query error:", queryError);
        setError("Database error. Please try again.");
        toast.error("Failed to verify phone number");
        return;
      }

      if (!data) {
        // Phone number not found
        setError("Number not recognized by college records");
        setIsVerified(false);
        setFullName("");
        setEnrollmentId("");
        toast.error("Student not found");
      } else {
        // Phone number found - auto-fill the form
        setFullName(data.full_name);
        setEnrollmentId(data.enrollment_id);
        setIsVerified(true);
        setError("");
        toast.success("Student verified successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      toast.error("Please verify your phone number first");
      return;
    }

    setIsLoading(true);
    try {
      // Re-confirm against student1 to make sure the record still exists
      const { data, error: queryError } = await supabase
        .from("student1")
        .select("full_name, enrollment_id, phone_number")
        .eq("phone_number", phoneNumber)
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();

      if (queryError || !data) {
        toast.error("We couldn't confirm your record. Please verify again.");
        return;
      }

      const session: StudentSession = {
        full_name: data.full_name,
        enrollment_id: data.enrollment_id,
        phone_number: data.phone_number,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      toast.success(`Welcome, ${data.full_name.split(" ")[0]}!`);
      navigate("/app", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPhoneNumber("");
    setFullName("");
    setEnrollmentId("");
    setIsVerified(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Student Registration</h1>
            <p className="text-indigo-100 text-sm mt-1">Enter your phone number to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Phone Number Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : isVerified
                        ? "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
                  }`}
                  disabled={isVerified}
                />
                {isVerified && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>

              {/* Verify Button */}
              {!isVerified && (
                <button
                  type="button"
                  onClick={verifyPhoneNumber}
                  disabled={isLoading || phoneNumber.length < 10}
                  className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Verify Phone Number
                    </>
                  )}
                </button>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {isVerified && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 font-medium">Phone number verified successfully!</p>
                </div>
              )}
            </div>

            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  readOnly
                  placeholder="Will auto-fill after verification"
                  className={`w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed ${
                    isVerified ? "font-medium" : ""
                  }`}
                />
              </div>
            </div>

            {/* Enrollment ID Input */}
            <div>
              <label htmlFor="enrollmentId" className="block text-sm font-semibold text-gray-700 mb-2">
                Enrollment ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="enrollmentId"
                  type="text"
                  value={enrollmentId}
                  readOnly
                  placeholder="Will auto-fill after verification"
                  className={`w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed ${
                    isVerified ? "font-medium" : ""
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isVerified && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                disabled={!isVerified}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Complete Registration
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <p className="text-center text-sm text-gray-500 mt-4">Need help? Contact your college administration</p>
        <p className="text-center text-sm text-gray-600 mt-2">
          Already have an account?{" "}
          <Link to="/auth" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;
