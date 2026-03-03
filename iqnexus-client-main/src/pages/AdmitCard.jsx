import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";

const AdmitCard = () => {
  const student = useSelector((state) => state.auth.user);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [admitCardUrl, setAdmitCardUrl] = useState(null);
  const [admitCardBlob, setAdmitCardBlob] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAdmitCard = async () => {
    try {
      setLoading(true);
      const levelMap = { "L1": "basic", "L2": "advanced" };
      const level = levelMap[selectedLevel] || "basic";
      // Compute session dynamically: Apr-Dec = current year, Jan-Mar = previous year
      const now = new Date();
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const session = `${year}-${String(year + 1).slice(-2)}`;

      const response = await axios.post(
        `${BASE_API_URL}/fetch-admit-card`,
        { mobNo: student["Mob No"], level, session },
        { responseType: "blob" }
      );

      if (response.status === 200 && response.data) {
        const blob = response.data;
        const pdfUrl = URL.createObjectURL(blob);
        setAdmitCardUrl(pdfUrl);
        setAdmitCardBlob(blob);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Error fetching admit card:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLevel) {
      fetchAdmitCard();
    }
  }, [selectedLevel, student]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (admitCardUrl) {
        URL.revokeObjectURL(admitCardUrl);
      }
    };
  }, [admitCardUrl]);

  const handleDownloadPDF = () => {
    if (admitCardBlob) {
      const url = URL.createObjectURL(admitCardBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admit-card-${selectedLevel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-3 w-full h-full flex flex-col p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center">
          <FileText />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">Admit Card</h2>
      </div>

      {/* Level Selection */}
      <div className="flex flex-col w-full gap-2 justify-center">
        <select
          className="w-full bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            setAdmitCardUrl(null); // Reset URL on level change
            setAdmitCardBlob(null); // Reset blob on level change
            setError(false); // Reset error on level change
          }}
        >
          <option value="">Select Level</option>
          <option value="L1">Level 1</option>
          <option value="L2">Level 2</option>
        </select>

      </div>

      {/* Admit Card Container */}
      <div className="flex items-center justify-center flex-1">
        <div className="relative w-full max-w-3xl animate-slideUp transition-all h-full">
          {admitCardUrl ? (
            <iframe 
              src={admitCardUrl} 
              title="Admit Card" 
              className="w-full h-[600px] border border-gray-200 rounded-lg shadow-md"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading Admit Card...</span>
                </div>
              ) : selectedLevel && error ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow-md">
                  <p className="font-semibold">
                    Admit Card Not Found. Please contact support for assistance.
                  </p>
                </div>
              ) : (
                <span className="text-gray-500">Please select Level</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Download Button */}
      {admitCardUrl && (
        <div className="flex justify-center items-center mt-4">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 w-fit text-center text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <Download size={16} />
            Download Admit Card (PDF)
          </button>
        </div>
      )}
    </div>
  );
};

export default AdmitCard;