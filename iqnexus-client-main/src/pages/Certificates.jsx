import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";

const Certificates = () => {
  const student = useSelector((state) => state.auth.user);
  const [selectedLevel, setSelectedLevel] = useState("IMO BASIC LEVEL");
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCertificate = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_API_URL}/fetch-ceritficate/${student["Mob No"]}`,
        { responseType: "blob" } // Important!
      );

      if (response.status === 200 && response.data) {
        const imageUrl = URL.createObjectURL(response.data);
        setCertificate(imageUrl);
      } else {
        console.error("Failed to fetch admit card.");
      }
    } catch (error) {
      console.error("Error fetching admit card:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
  }, [student]);

  return (
    <div className="space-y-4 w-full h-full p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center">
          <span className=" font-semibold">
            <FileText />
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">Certificates</h1>
      </div>

      {/* Level Selector */}
      <div>
        <select
          className="w-full bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="IMO BASIC LEVEL">IMO BASIC LEVEL</option>
          <option value="IMO ADVANCED LEVEL">IMO ADVANCED LEVEL</option>
        </select>
      </div>

      {/* Certificate Preview */}
      <div className="flex justify-center">
        <div className="rounded-md p-2">
          {loading ? (
            <div className="text-center text-gray-500">
              Loading Certificate...
            </div>
          ) : certificate ? (
            <img
              src={certificate}
              alt="Certificate"
              className="w-full object-contain"
            />
          ) : (
            <div className="text-center text-red-500">
              No Certificate Available
            </div>
          )}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-col md:flex-row justify-center items-center mt-4">
        <button className="bg-blue-600 w-fit text-center text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all">
          <Download size={16} />
          Download PDF
        </button>
        <button className="text-blue-600 px-4 py-2 hover:underline">or</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all">
          <Download size={16} />
          Download Image
        </button>
      </div>
    </div>
  );
};

export default Certificates;
