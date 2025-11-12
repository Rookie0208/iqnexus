import React, { useEffect, useState } from "react";
import { Users, School, BookOpen } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../Api";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSchools, setTotalSchools] = useState(0);
  const [totalStudyMaterials, setTotalStudyMaterials] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashoardAnalytics = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/dashboard-analytics`);
        if (response.data.success) {
          setTotalStudents(response.data.allStudents);
          setTotalSchools(response.data.allSchools);
          setTotalStudyMaterials(response.data.allStudyMaterials);
        } else {
          console.error("Failed to fetch dashboard analytics.");
        }
      } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
      }
    };

    fetchDashoardAnalytics();
  });

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
    // {
    //   title: "Active Classes",
    //   value: "86",
    //   icon: <BookOpen size={24} />,
    //   color: "bg-yellow-600",
    //   gradient: "from-yellow-600 to-yellow-400",
    // },
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

        {/* Additional Dashboard Content (Optional) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* You can add more widgets here, e.g., recent activity, charts */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <p className="text-gray-600">
              Add more detailed statistics or charts here as needed.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Updates
            </h3>
            <p className="text-gray-600">
              Placeholder for recent activities or notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
