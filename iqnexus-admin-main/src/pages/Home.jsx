import React, { useEffect, useState } from "react";
import { Users, School, BookOpen, Baby } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../Api";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);
  const [totalStudyMaterials, setTotalStudyMaterials] = useState(0);
  const [totalKGStudents, setTotalKGStudents] = useState(0);
  const [classWiseCounts, setClassWiseCounts] = useState([]);
  const [kgSectionCounts, setKgSectionCounts] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [cityWiseSchools, setCityWiseSchools] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashoardAnalytics = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/dashboard-analytics`);
        if (response.data.success) {
          setTotalStudents(response.data.allStudents);
          setTotalSchools(response.data.allSchools);
          setTotalStudyMaterials(response.data.allStudyMaterials);
          setTotalKGStudents(response.data.allKGStudents || 0);
          setClassWiseCounts(response.data.classWiseCounts || []);
          setKgSectionCounts(response.data.kgSectionCounts || []);
          setRecentUpdates(response.data.recentUpdates || []);
          setCityWiseSchools(response.data.cityWiseSchools || []);
        } else {
          console.error("Failed to fetch dashboard analytics.");
        }
      } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
      }
    };

    fetchDashoardAnalytics();
  }, []);

  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: <Users size={24} />,
      color: "bg-blue-600",
      gradient: "from-blue-600 to-blue-400",
      href: "/allStudents",
      clickable: true,
    },
    {
      title: "KG Students",
      value: totalKGStudents,
      icon: <Baby size={24} />,
      color: "bg-orange-600",
      gradient: "from-orange-600 to-orange-400",
      href: "/allKindergartenStudents",
      clickable: true,
    },
    {
      title: "Total Schools",
      value: totalSchools,
      icon: <School size={24} />,
      color: "bg-green-600",
      gradient: "from-green-600 to-green-400",
      href: "/allSchools",
      clickable: true,
    },
    {
      title: "All Study Materials",
      value: totalStudyMaterials,
      icon: <BookOpen size={24} />,
      color: "bg-purple-600",
      gradient: "from-purple-600 to-purple-400",
    },
  ];

  // Mock user data (replace with actual user data from your auth system)
  const user = {
    name: "Admin User",
    avatar: "https://i.pravatar.cc/150?img=68", // Random avatar URL
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Overview
              </h1>
              <p className="mt-1 text-gray-600">
                Welcome back, {user.name}! Here's your school management
                summary.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <img
                src={user.avatar}
                alt="User avatar"
                className="w-12 h-12 rounded-full border-2 border-gray-200 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
          {stats.map((stat, index) => (
            <div
              onClick={() => navigate(stat.href)}
              key={index}
              className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 ${
                stat.clickable ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br ${stat.gradient} text-white mb-4`}
              >
                {stat.icon}
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {stat.value}
              </h2>
              <p className="text-gray-600 text-sm mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Additional Dashboard Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              {/* Class-wise student counts */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Students by Class</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {classWiseCounts.map((item) => (
                    <div key={item._id} className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Class {item._id}</p>
                      <p className="text-sm font-bold text-blue-700">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* KG Section-wise counts */}
              {kgSectionCounts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">KG Students by Section</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {kgSectionCounts.map((item) => (
                      <div key={item._id} className="bg-orange-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">{item._id}</p>
                        <p className="text-sm font-bold text-orange-700">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* City-wise school counts */}
              {cityWiseSchools.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Schools by City (Top 10)</h4>
                  <div className="space-y-1">
                    {cityWiseSchools.map((item) => (
                      <div key={item._id} className="flex justify-between items-center px-2 py-1 bg-green-50 rounded">
                        <span className="text-xs text-gray-700">{item._id || "Unknown"}</span>
                        <span className="text-xs font-bold text-green-700">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Recent Updates */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Updates
            </h3>
            {recentUpdates.length > 0 ? (
              <div className="space-y-3">
                {recentUpdates.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        item.type === "kindergarten"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                    >
                      {item.studentName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.studentName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.type === "kindergarten" ? "KG" : `Class ${item.class}`}
                        {" | Roll: "}
                        {item.rollNo} | School: {item.schoolCode}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent activity available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
