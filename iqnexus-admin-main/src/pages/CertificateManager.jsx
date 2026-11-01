import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";
import CalendarYearSelect from "../components/CalendarYearSelect";
import { Download, FileText, Loader2 } from "lucide-react";

const CERT_TYPES = [
  { value: "participation", label: "Participation" },
  { value: "l1", label: "Level 1 (Basic) Achievement" },
  { value: "l2", label: "Level 2 (Advanced) Achievement" },
  { value: "prize", label: "Prize / Merit" },
];

const CertificateManager = () => {
  const [schoolCode, setSchoolCode] = useState("");
  const [certType, setCertType] = useState("participation");
  const [examLevel, setExamLevel] = useState("");
  const [calendarYear, setCalendarYear] = useState("");
  const [mobNo, setMobNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleBulk = async () => {
    if (!schoolCode) {
      setMessage({ type: "error", text: "School code is required" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await axios.post(
        `${BASE_URL}/generate-certificates-bulk`,
        {
          schoolCode: Number(schoolCode),
          type: certType,
          calendarYear: calendarYear || undefined,
          examLevel: examLevel || undefined,
        },
        { responseType: "blob" }
      );

      const count = res.headers["x-certificate-count"] || "";
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certType}_certificates_${schoolCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: `Bulk PDF downloaded${count ? ` (${count} certificates)` : ""}.`,
      });
    } catch (err) {
      let text = "Bulk generation failed";
      try {
        const data = await err.response?.data?.text?.();
        if (data) {
          const parsed = JSON.parse(data);
          text = parsed.error || parsed.message || text;
        }
      } catch {
        text = err.response?.data?.error || err.message || text;
      }
      setMessage({ type: "error", text });
    } finally {
      setBusy(false);
    }
  };

  const handleSingleGenerate = async () => {
    if (!mobNo) {
      setMessage({ type: "error", text: "Mobile number is required" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const gen = await axios.post(`${BASE_URL}/generate/${certType}`, {
        mobNo: String(mobNo).trim(),
        force: true,
      });
      const fetchRes = await axios.get(
        `${BASE_URL}/fetch-certificate/${encodeURIComponent(String(mobNo).trim())}`,
        { params: { type: certType }, responseType: "blob" }
      );
      const blob = new Blob([fetchRes.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certType}_${mobNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: gen.data?.message || "Certificate generated and downloaded",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Single certificate failed",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Certificates</h1>
            <p className="text-sm text-gray-500">
              Generate Participation, L1, L2, or Prize certificates. Bulk download is a
              multi-page PDF (one page per student).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Certificate type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
            >
              {CERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <CalendarYearSelect value={calendarYear} onChange={setCalendarYear} />
          <div>
            <label className="block text-sm font-medium mb-1">Exam level (optional)</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={examLevel}
              onChange={(e) => setExamLevel(e.target.value)}
            >
              <option value="">Any / All enrolled</option>
              <option value="L1">Basic (L1)</option>
              <option value="L2">Advance (L2)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">School code (bulk)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="e.g. 1100"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleBulk}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Generate & download bulk PDF
          </button>
        </div>

        <hr />

        <div>
          <h2 className="font-semibold text-gray-800 mb-2">Single student</h2>
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-1">Mobile number</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={mobNo}
                onChange={(e) => setMobNo(e.target.value)}
                placeholder="Student mobile"
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleSingleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              Generate & download
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateManager;
