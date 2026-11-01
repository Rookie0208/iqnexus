import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";

const LEVEL_TO_TYPE = {
  "BASIC LEVEL": "l1",
  "ADVANCED LEVEL": "l2",
  PARTICIPATION: "participation",
};

const Certificates = () => {
  const student = useSelector((state) => state.auth.user);
  const [selectedLevel, setSelectedLevel] = useState("PARTICIPATION");
  const [certificate, setCertificate] = useState(null);
  const [certificateBlob, setCertificateBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const certType = LEVEL_TO_TYPE[selectedLevel] || "participation";
  const mobNo = student?.["Mob No"] || student?.mobNo;

  const fetchCertificate = async () => {
    if (!mobNo) {
      setError("Student mobile number missing");
      return;
    }
    setLoading(true);
    setError("");
    setCertificate(null);
    setCertificateBlob(null);
    try {
      // Ensure certificate exists (idempotent if already stored)
      try {
        await axios.post(`${BASE_API_URL}/generate/${certType}`, {
          mobNo,
          force: false,
        });
      } catch (genErr) {
        // Continue to fetch — may already exist
        console.warn("Generate skipped/failed:", genErr?.response?.data || genErr.message);
      }

      const response = await axios.get(
        `${BASE_API_URL}/fetch-certificate/${encodeURIComponent(mobNo)}`,
        {
          params: { type: certType },
          responseType: "blob",
        }
      );

      if (response.status === 200 && response.data) {
        const blob = response.data;
        // PDFs aren't images — use object URL for iframe/embed
        const url = URL.createObjectURL(blob);
        setCertificate(url);
        setCertificateBlob(blob);
      } else {
        setError("Failed to fetch certificate.");
      }
    } catch (err) {
      console.error("Error fetching certificate:", err);
      setError(
        err.response?.status === 404
          ? "No certificate available yet. Ask your school/admin to generate it."
          : "Error loading certificate."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
    return () => {
      if (certificate) URL.revokeObjectURL(certificate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, selectedLevel]);

  return (
    <div className="space-y-4 w-full h-full p-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center">
          <FileText />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">Certificates</h1>
      </div>

      <div>
        <select
          className="w-full bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="PARTICIPATION">Participation</option>
          <option value="BASIC LEVEL">Level 1 — Basic Achievement</option>
          <option value="ADVANCED LEVEL">Level 2 — Advanced Achievement</option>
        </select>
      </div>

      <div className="flex justify-center">
        <div className="rounded-md p-2 w-full max-w-4xl">
          {loading ? (
            <div className="text-center text-gray-500">Loading Certificate...</div>
          ) : certificate ? (
            <iframe
              title="Certificate PDF"
              src={certificate}
              className="w-full h-[70vh] border rounded"
            />
          ) : (
            <div className="text-center text-red-500">
              {error || "No Certificate Available"}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center mt-4">
        <button
          onClick={() => {
            if (certificateBlob) {
              const url = URL.createObjectURL(certificateBlob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `certificate-${certType}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }}
          disabled={!certificateBlob}
          className="bg-blue-600 w-fit text-center text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default Certificates;
