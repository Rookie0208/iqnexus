import React, { useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  GraduationCap,
  BookOpen,
  Award,
  KeyRound,
  MessageSquare,
  PenTool,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";

function MenuItem({
  icon,
  text,
  active = false,
  delay = 0,
  href = "#",
  onClick,
}) {
  const dispatch = useDispatch();

  const handleClick = (e) => {
    if (text === "Log Out") {
      e.preventDefault(); // Only prevent default for logout
      dispatch(logout());
    }

    if (onClick) onClick(); // Optional: closeSidebar
  };

  return (
    <Link
      to={href}
      onClick={handleClick}
      className={`group flex items-center gap-3 px-6 py-3 text-sm transition-all duration-300 animate-slide-in ${active ? "bg-blue-900 font-semibold" : "hover:bg-blue-800"
        }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span>{text}</span>
    </Link>
  );
}

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#003B87] text-white hover:bg-[#002d69] transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 bg-[#003B87] text-white flex flex-col shadow-xl h-full z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="flex items-center justify-center pt-4">
          <img
            src="/main_logo.png"
            alt="IQ Nexus Logo"
            className="lg:w-50 w-32 object-contain rounded-full"
          />
        </div>

        <nav className="mt-2 space-y-1">
          <MenuItem
            icon={<LayoutDashboard size={20} />}
            text="DASHBOARD"
            active
            delay={0}
            href="/dashboard"
            onClick={closeSidebar}
          />
          <MenuItem
            icon={<CreditCard size={20} />}
            text="ADMIT CARD"
            delay={100}
            href="/admit-card"
            onClick={closeSidebar}
          />
          <MenuItem
            icon={<GraduationCap size={20} />}
            text="RESULTS"
            delay={200}
            href="/results"
            onClick={closeSidebar}
          />
          <MenuItem
            icon={<BookOpen size={20} />}
            text="STUDY MATERIALS"
            delay={300}
            href="/study-materials"
            onClick={closeSidebar}
          />
          <MenuItem
            icon={<Award size={20} />}
            text="CERTIFICATIONS"
            delay={400}
            href="/certificates"
            onClick={closeSidebar}
          />
          <MenuItem
            icon={<KeyRound size={20} />}
            text="ANSWER KEY"
            delay={500}
            href="/answer-key"
            onClick={closeSidebar}
          />
          <MenuItem
            icon={<MessageSquare size={20} />}
            text="FEEDBACK"
            delay={600}
            href="/feedback"
            onClick={closeSidebar}
          />
          {/* <MenuItem
            icon={<PenTool size={20} />}
            text="PRACTICE OMR"
            delay={700}
            href="/practice-omr"
            onClick={closeSidebar}
          /> */}
        </nav>

        <div className="absolute bottom-0 left-0 w-full border-t border-blue-800 bg-[#002d69]">
          {/* <MenuItem
            icon={<Settings size={20} />}
            text="Settings"
            delay={800}
            href="/settings"
            onClick={closeSidebar}
          /> */}
          <MenuItem
            icon={<LogOut size={20} />}
            text="Log Out"
            href="/"
            delay={900}
            onClick={closeSidebar}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto md:ml-0">
        <div className="md:ml-0 mt-16 md:mt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
