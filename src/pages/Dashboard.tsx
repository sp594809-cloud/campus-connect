import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Phone, Hash, Sparkles, ArrowRight } from "lucide-react";
import { getStudentSession } from "./Index";

const Dashboard = () => {
  const navigate = useNavigate();
  const session = getStudentSession();

  // Persistence guard: not logged in → back to registration
  useEffect(() => {
    if (!session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  if (!session) return null;

  const handleLogout = () => {
    localStorage.removeItem("campus_student_session");
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Welcome 👋</h1>
            <p className="text-indigo-100 text-sm mt-1">{session.full_name}</p>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={() => navigate("/campus")}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold py-3 rounded-xl shadow-lg"
            >
              <Sparkles className="h-4 w-4" /> Enter Campus Connect <ArrowRight className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Hash className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Enrollment ID</p>
                <p className="font-semibold text-gray-800">{session.enrollment_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-semibold text-gray-800">{session.phone_number}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;