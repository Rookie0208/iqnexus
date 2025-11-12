import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";

function InfoField({ label, value, delay = 0 }) {
  return (
    <div
      className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}

const AccordionSection = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-4 border-b text-left text-lg font-semibold text-indigo-700 hover:bg-indigo-50 transition duration-200"
      >
        {title}
        <span className="text-xl">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-6 py-6">{children}</div>}
    </div>
  );
};

const Dashboard = () => {
  const student = useSelector((state) => state.auth.user);
  const [admitCard, setAdmitCard] = useState({});

  const phone = student["Mob No"];

  console.log(student);


  useEffect(() => {
    const fetchAdmitCard = async () => {
      try {
        const res = await axios.get(`${BASE_API_URL}/student-admit-card/${phone}`);
        setAdmitCard(res.data.result);
      } catch (error) {
        console.error("Error fetching admit card:", error);
      }
    };
    fetchAdmitCard();
  }, [phone]);

  const hasParticipated = (key) => student?.[key] === "1";

  const subjectNameMap = {
  IMOL: "IQMO",
  ITSTL: "IQSO",
  IENGOL: "IQEO",
  IAOL: "IQRO",
  IGKOL: "IQGKO",
};

const subjects = Array.from(
  new Set(
    Object.keys(student || {})
      .filter((key) => key.match(/^(.*)(L Basic|L Advance|L Basic Book)$/))
      .map((key) => key.split(" ")[0])
  )
).map((prefix) => ({
  prefix,
  display: subjectNameMap[prefix] || prefix, // fallback to original if not mapped
}));

  return (
    <div className="flex-1 w-full min-h-screen lg:p-2 p-4">
      {/* Admit Card Notification */}
      {Object.keys(admitCard).length > 0 && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg shadow-md animate-fade-in">
          <p className="font-semibold">
            Admit Card Available!{" "}
            <a
              href="/admit-card"
              rel="noopener noreferrer"
              className="underline hover:text-green-600 transition-colors duration-200"
            >
              Click here to download
            </a>
          </p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
            <span className="text-white font-semibold text-xl">
              {student?.["Student's Name"]?.charAt(0) || "S"}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {student?.["Student's Name"] || "Student"}
            </h2>
            <p className="text-gray-600">Your Dashboard Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <img
            src={`https://i.pravatar.cc/100?u=${student?.["Mob No"]}`}
            alt="User Avatar"
            className="w-14 h-14 rounded-full border border-gray-300 object-cover"
          />
        </div>
      </div>

      {/* Info Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InfoField label="ROLL NO" value={student?.["Roll No"] || "N/A"} delay={0} />
        <InfoField label="STUDENT NAME" value={student?.["Student's Name"] || "N/A"} delay={100} />
        <InfoField label="FATHER'S NAME" value={student?.["Father's Name"] || "N/A"} delay={200} />
        <InfoField label="MOTHER'S NAME" value={student?.["Mother's Name"] || "N/A"} delay={300} />
        <InfoField label="MOBILE NO" value={student?.["Mob No"] || "N/A"} delay={400} />
        <InfoField label="SCHOOL NAME" value={student?.School || "N/A"} delay={500} />
        <InfoField label="SCHOOL CODE" value={student?.["School Code"] || "N/A"} delay={600} />
        <InfoField
          label="CLASS AND SECTION"
          value={`${student?.Class || ""} ${student?.Section || ""}`.trim() || "N/A"}
          delay={700}
        />
        <InfoField
          label="SCHOOL AREA, CITY"
          value={`${student?.Area || ""}, ${student?.["School City"] || ""}`.trim() || "N/A"}
          delay={800}
        />
      </div>

      {/* Participation Details */}
      <AccordionSection title="Participation Details">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Level</th>
                {subjects.map((subject, idx) => (
                  <th key={idx} className="px-6 py-3 text-left">
                    {subject.display}
                  </th>
                ))}
                <th className="px-6 py-3 text-left">Exam Fee Paid</th>
              </tr>
            </thead>
            <tbody>
              {/* Basic Level */}
              <tr className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                      B
                    </div>
                    <span className="ml-3 font-medium">Basic</span>
                  </div>
                </td>
                {subjects.map((subject, idx) => (
                  <td key={idx} className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasParticipated(`${subject.prefix} Basic`)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {hasParticipated(`${subject.prefix} Basic`) ? "Yes" : "Not participated"}
                    </span>
                  </td>
                ))}
                <td className="px-6 py-4 text-gray-600">
                  Cash: ₹{student["Basic Level Paid Amount"] || "0"}, Online: ₹
                  {student["Basic Level Amount Paid Online"] || "0"}
                </td>
              </tr>

              {/* Advance Level */}
              <tr className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                      A
                    </div>
                    <span className="ml-3 font-medium">Advance</span>
                  </div>
                </td>
                {subjects.map((subject, idx) => (
                  <td key={idx} className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasParticipated(`${subject.prefix} Advance`)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {hasParticipated(`${subject.prefix} Advance`)
                        ? subject.display === "IIMOL"
                          ? "✓ Qualified"
                          : "Yes"
                        : "Not participated"}
                    </span>
                  </td>
                ))}
                <td className="px-6 py-4 text-gray-600">
                  Cash: ₹{student["Advance Level Paid Amount"] || "0"}, Online: ₹
                  {student["Advance Level Amount Paid Online"] || "0"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AccordionSection>

      {/* Workbook Details */}
      <AccordionSection title="Workbook Details">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase font-semibold">
              <tr>
                {subjects.map((subject, idx) => (
                  <th key={idx} className="px-6 py-3 text-left">
                    {subject.display}
                  </th>
                ))}
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b last:border-b-0 hover:bg-gray-50 transition duration-200">
                {subjects.map((subject, idx) => (
                  <td key={idx} className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasParticipated(`${subject.prefix} Basic Book`)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {hasParticipated(`${subject.prefix} Basic Book`) ? "Yes" : "No"}
                    </span>
                  </td>
                ))}
                <td className="px-6 py-4 text-gray-600">
                  {subjects.some((subject) => hasParticipated(`${subject.prefix} Basic Book`)) &&
                    student.bookStatus
                    ? `Delivered on ${student.bookStatus}`
                    : "Not delivered"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AccordionSection>
    </div>
  );
};

export default Dashboard;