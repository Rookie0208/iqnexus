import React, { useState } from "react";
import {
  Menu,
  X,
  UserPlus,
  School,
  FileUp,
  Building2,
  LayoutDashboard,
  Users,
  IdCard,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CalendarDays,
  Trophy,
  BookOpen,
  BarChart3,
  Award
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/main_logo.png";

const MenuItem = ({
  icon,
  text,
  href = "#",
  active = false,
  delay = 0,
  onClick,
  children,
  isDropdown = false,
  isOpen = false
}) => (
  < div className={`group ${active ? "bg-blue-900" : "hover:bg-blue-800"}`}>
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-center justify-between px-6 py-3 text-sm transition-all duration-300 ${active ? "font-semibold" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
        <span className="text-md">{text}</span>
      </div>
      {isDropdown && (
        <span>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      )}
    </Link>
    {children}
  </div>
);

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [participationOpen, setParticipationOpen] = useState(false);
  const location = useLocation();
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [KGStudentsOpen, setKGStudentsOpen] = useState(false);
  const [StudyMaterialOpen, setStudyMaterialOpen] = useState(false);
  const [prizeOpen, setPrizeOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => window.innerWidth < 768 && setIsOpen(false);
  const toggleParticipation = () => setParticipationOpen(!participationOpen);
  const togglePrize = () => setPrizeOpen(!prizeOpen);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className=" fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#003B87] text-white hover:bg-[#002d69] transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
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
        {/* Logo */}
        <div className="flex items-center justify-center pt-4">
          <img
            src={logo}
            alt="IQ Nexus Logo"
            className="lg:w-48 w-32 object-contain rounded-full"
          />
        </div>

        {/* Scrollable Navigation */}
              <div className="flex-1 overflow-y-auto py-4" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.4) rgba(0,0,0,0.1)'
              }}>

              <nav className="space-y-1">
                <MenuItem
                icon={<LayoutDashboard size={20} />}
                text="Dashboard"
                href="/"
                active={location.pathname === "/"}
                onClick={closeSidebar}
                />
                <MenuItem
                icon={<CalendarDays size={20} />}
                text="Calendar Year"
                href="/calendar-year"
                active={location.pathname === "/calendar-year"}
                onClick={closeSidebar}
                />
                {/* Schools Dropdown */}
                <MenuItem
                icon={<Building2 size={20} />}
                text="Schools"
                href="#"
                active={location.pathname.startsWith("/allSchools")}
                onClick={e => {
                  e.preventDefault();
                  setSchoolsOpen?.(prev => !prev);
                }}
                isDropdown={true}
                isOpen={schoolsOpen}
                >
                {schoolsOpen && (
                  <div className="bg-[#003B87] pl-6">
                  <MenuItem
                    text="All Schools"
                    href="/allSchools"
                    active={location.pathname === "/allSchools"}
                    onClick={closeSidebar}
                  />
                  <MenuItem
                    text="Add School"
                    href="/singleSchool"
                    active={location.pathname === "/singleSchool"}
                    onClick={closeSidebar}
                  />
                  </div>
                )}
                </MenuItem>
                {/* End Schools Dropdown */}
              <MenuItem
                icon={<Users size={20} />}
                text="Students"
                href="#"
                active={location.pathname.startsWith("/allStudents")}
                onClick={e => {
                  e.preventDefault();
                  setStudentsOpen?.(prev => !prev);
                }}
                isDropdown={true}
                isOpen={studentsOpen}
                >
                {studentsOpen && (
                  <div className="bg-[#003B87] pl-6">

              <MenuItem
                icon={<Users size={20} />}
                text="All Students"
                href="/allStudents"
                active={location.pathname === "/allStudents"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<FileUp size={20} />}
                text="Upload Students"
                href="/uploadStudentData"
                active={location.pathname === "/uploadStudentData"}
                onClick={closeSidebar}
              />
              
              <MenuItem
                icon={<UserPlus size={20} />}
                text="Add Student"
                href="/singleStudent"
                active={location.pathname === "/singleStudent"}
                onClick={closeSidebar}
              /></div>)}
              </MenuItem>
              
              <MenuItem
                icon={<IdCard size={20} />}
                text="Admit Card"
                href="/genrate-admit-card"
                active={location.pathname === "/genrate-admit-card"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<ClipboardList size={20} />}
                text="Qualified List"
                href="/QualifiedList"
                active={location.pathname === "/QualifiedList"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<FileUp size={20} />}
                text="Upload Results"
                href="/uploadresults"
                active={location.pathname === "/uploadresults"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<ClipboardList size={20} />}
                text="View Results"
                href="/ViewResults"
                active={location.pathname === "/ViewResults"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<School size={20} />}
                text="Exam Management"
                href="/ExamManagement"
                active={location.pathname === "/ExamManagement"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<BookOpen size={20} />}
                text="Subject Management"
                href="/subject-management"
                active={location.pathname === "/subject-management"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<BarChart3 size={20} />}
                text="Ranking & Results"
                href="/ranking-management"
                active={location.pathname === "/ranking-management"}
                onClick={closeSidebar}
              />
              <MenuItem
                icon={<Trophy size={20} />}
                text="Prize"
                href="#"
                active={location.pathname.startsWith("/prize")}
                onClick={(e) => {
                  e.preventDefault();
                  togglePrize();
                }}
                isDropdown={true}
                isOpen={prizeOpen}
              >
                {prizeOpen && (
                  <div className="bg-[#003B87] pl-6">
                    <MenuItem
                      text="Prize Config"
                      href="/prize-config"
                      active={location.pathname === "/prize-config"}
                      onClick={closeSidebar}
                    />
                    <MenuItem
                      text="Prize Tag"
                      href="/prize-tag"
                      active={location.pathname === "/prize-tag"}
                      onClick={closeSidebar}
                    />
                    <MenuItem
                      text="Prize Override"
                      href="/prize-override"
                      active={location.pathname === "/prize-override"}
                      onClick={closeSidebar}
                    />
                  </div>
                )}
              </MenuItem>

              {/* Participation List Dropdown */}
            <MenuItem
              icon={<ClipboardList size={20} />}
              text="Participation List"
              href="#"
              active={location.pathname.startsWith("/participation")}
              onClick={(e) => {
                e.preventDefault();
                toggleParticipation();
              }}
              isDropdown={true}
              isOpen={participationOpen}
            >
              {participationOpen && (
                <div className="bg-[#003B87] pl-6"> {/* Match sidebar background color */}
                  <MenuItem
                    text="School-wise Participation"
                    href="/School-wise"
                    active={location.pathname === "/School-wise"}
                    onClick={closeSidebar}
                  />
                  <MenuItem
                    text="Section-wise Participation"
                    href="/Section-wise"
                    active={location.pathname === "/Section-wise"}
                    onClick={closeSidebar}
                  />
                  <MenuItem
                    text="Class-wise Participation"
                    href="/Class-wise"
                    active={location.pathname === "/Class-wise"}
                    onClick={closeSidebar}
                  />
                  <MenuItem
                    text="Cost-wise Participation"
                    href="/Cost-wise"
                    active={location.pathname === "/Cost-wise"}
                    onClick={closeSidebar}
                  />

                </div>
              )}
            </MenuItem>
            <MenuItem
              icon={<ClipboardList size={20} />}
              text="Feedbacks"
              href="/Feedbackview"
              active={location.pathname === "/Feedbackview"}
              onClick={closeSidebar}
            />
            <MenuItem
                icon={<FileUp size={20} />}
                text="Study Material"
                href="#"
                active={location.pathname.startsWith("/StudyMaterial")}
                onClick={e => {
                  e.preventDefault();
                  setStudyMaterialOpen?.(prev => !prev);
                }}
                isDropdown={true}
                isOpen={StudyMaterialOpen}
                >
                {StudyMaterialOpen && (
                  <div className="bg-[#003B87] pl-6">
            <MenuItem
              icon={<FileUp size={20} />}
              text="Upload Study Material"
              href="/StudyMaterial"
              active={location.pathname === "/StudyMaterial"}
              onClick={closeSidebar}
            />
            <MenuItem
              icon={<FileUp size={20} />}
              text="View Study Material"
              href="/Studymatview"
              active={location.pathname === "/Studymatview"}
              onClick={closeSidebar}
            /></div>)}</MenuItem>


            {/* KG Students Section */}
            <MenuItem
                icon={<Users size={20} />}
                text="KG Students"
                href="#"
                active={location.pathname.startsWith("/allkindargartenStudents")}
                onClick={e => {
                  e.preventDefault();
                  setKGStudentsOpen?.(prev => !prev);
                }}
                isDropdown={true}
                isOpen={KGStudentsOpen}
                >
                {KGStudentsOpen && (
                  <div className="bg-[#003B87] pl-6">
            <MenuItem
              icon={<Users size={20} />}
              text="All KG Students"
              href="/allkindargartenStudents"
              active={location.pathname === "/allkindargartenStudents"}
              onClick={closeSidebar}
            />
            <MenuItem
              icon={<UserPlus size={20} />}
              text="Add KG Student"
              href="/kindargartenStudent"
              active={location.pathname === "/kindargartenStudent"}
              onClick={closeSidebar}
            />
            <MenuItem
              icon={<FileUp size={20} />}
              text="Upload KG Students"
              href="/uploadKindergartenStudentData"
              active={location.pathname === "/uploadKindergartenStudentData"}
              onClick={closeSidebar}
            /></div>)}</MenuItem>
            <MenuItem
              icon={<FileUp size={20} />}
              text="Upload Answer Key"
              href="/answer-key-upload"
              active={location.pathname === "/answer-key-upload"}
              onClick={closeSidebar}
            />
       
            <MenuItem
              icon={<Users size={20} />}  
              text="Teachers Data"
              href="/teachers-data"
              active={location.pathname === "/teachers-data"}
              onClick={closeSidebar}
            />
            <MenuItem
              icon={<FileUp size={20} />}
              text="Update Advance List"
              href="/updateAdvanceList"
              active={location.pathname === "/updateAdvanceList"}
              onClick={closeSidebar}
            />
            
          </nav>
        </div>

        {/* Optional Fixed Footer */}
        {/* <div className="border-t border-blue-800 bg-[#002d69]">
          <MenuItem
            icon={<LogOut size={20} />}
            text="Log Out"
            href="/logout"
            active={false}
            onClick={closeSidebar}
          />
        </div> */}
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