import { ChevronDown, ArrowRight } from "lucide-react";
import mainLogo from "../assets/main_logo.png";
import axios from "axios";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import { BASE_API_URL } from "../Api";
import { useState } from "react";

const LoginPage = () => {
  const [batch, setBatch] = useState("2024-25");
  const [mobile, setMobile] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [studentOptions, setStudentOptions] = useState([]);

  // Popup for selecting student profile
  const handleSelectStudent = (student) => {
    // Calculate expiration timestamp (7 days from now)
    const expirationDays = 7;
    const expirationTime = new Date().getTime() + expirationDays * 24 * 60 * 60 * 1000;

    // Save to localStorage with expiration
    localStorage.setItem("student_mobile", mobile);
    localStorage.setItem("student_data", JSON.stringify(student));
    localStorage.setItem("auth_expiration", expirationTime.toString());

    // Update Redux state
    dispatch(login({ user: student, token: mobile }));
    setIsPopupOpen(false);
  };

  // handleLogin always shows popup if any student found
  const handleLogin = async () => {
    setFormSubmitting(true);
    setLoading(true);
    if (!mobile) {
      alert("Please enter your mobile number.");
      setFormSubmitting(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BASE_API_URL}/get-student`, {
        headers: {
          authorization: `Bearer ${mobile}`,
        },
      });
      if (response.status === 200 && response.data) {
        let studentData = response.data.studentData;
        // Always treat studentData as an array, even if falsy or duplicate
        if (!Array.isArray(studentData)) {
          studentData = studentData !== undefined && studentData !== null ? [studentData] : [];
        }
        // Only show alert if array is empty
        if (Array.isArray(studentData) && studentData.length > 0) {
          setStudentOptions(studentData);
          setIsPopupOpen(true);
        } else {
          alert("No student record found.");
        }
      } else {
        alert("Invalid credentials or no data found.");
      }
        } catch (error) {
      const status = error.response?.status;
      const errMsg = error.response?.data?.error || "Something went wrong";
      // Only show "No student found" if API returns empty array
      if (Array.isArray(error.response?.data?.studentData) && error.response.data.studentData.length === 0) {
        alert("No student record found.");
      } else if (status === 500) {
        alert("Server error: Failed to fetch student data");
      } else if (status === 400) {
        alert("Invalid request: Mobile number is required");
      } else {
        alert(errMsg);
      }
        } finally {
      setFormSubmitting(false);
      setLoading(false);
        }
      };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Select Student Profile</h2>
            <div className="space-y-2">
              {studentOptions.map((student, idx) => (
                <button
                  key={student._id || idx}
                  onClick={() => handleSelectStudent(student)}
                  className="w-full flex flex-col items-start border border-gray-200 rounded-lg px-4 py-3 hover:bg-blue-50 transition-all duration-200 mb-2"
                >
                  <span className="font-medium text-blue-700">{student["Student's Name"]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsPopupOpen(false)}
              className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 font-medium transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-4 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-44 h-44 rounded-2xl mx-auto flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img
                src={mainLogo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Select Batch
              </label>
              <div className="relative">
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all duration-300 bg-white pr-10"
                >
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Mobile Number
              </label>
              <input
                type="text"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={formSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {formSubmitting ? "Logging In..." : "Login"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
          <div className="pt-4 text-center">
            <p className="text-xs text-gray-400">
              Having trouble logging in?{" "}
              <a
                href="mailto:support@iqnexus.in"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;