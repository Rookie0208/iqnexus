import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_API_URL } from "../Api";
import jsPDF from "jspdf";

const AdmitCard = () => {
  const student = useSelector((state) => state.auth.user);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [admitCardImage, setAdmitCardImage] = useState(null);
  const [admitCardBlob, setAdmitCardBlob] = useState(null);
  const [error, setError] = useState(false);

  const fetchAdmitCard = async () => {
    try {
      const levelMap = { "L1": "basic", "L2": "advanced" };
      const level = levelMap[selectedLevel] || "basic";
      const session = "2024-25";

      const response = await axios.post(
        `${BASE_API_URL}/fetch-admit-card`,
        { mobNo: student["Mob No"], level, session },
        { responseType: "blob" }
      );

      if (response.status === 200 && response.data) {
        const blob = response.data;
        const imageUrl = URL.createObjectURL(blob);
        setAdmitCardImage(imageUrl);
        setAdmitCardBlob(blob);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Error fetching admit card:", error);
      setError(true);
    }
  };

  useEffect(() => {
    if (selectedLevel) {
      fetchAdmitCard();
    }
  }, [selectedLevel, student]);

  const downloadFile = (blob, fileName, type) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (admitCardBlob) {
      // Create a new jsPDF instance
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Load the PNG blob as an image
      const img = new Image();
      img.src = URL.createObjectURL(admitCardBlob);
      img.onload = () => {
        // Calculate dimensions to fit the image within A4 (210mm x 297mm)
        const imgWidth = img.width;
        const imgHeight = img.height;
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 10; // Margin in mm
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 2 * margin;

        // Scale the image to fit within the page
        let pdfWidth = imgWidth;
        let pdfHeight = imgHeight;
        const aspectRatio = imgWidth / imgHeight;

        if (pdfWidth > maxWidth) {
          pdfWidth = maxWidth;
          pdfHeight = pdfWidth / aspectRatio;
        }
        if (pdfHeight > maxHeight) {
          pdfHeight = maxHeight;
          pdfWidth = pdfHeight * aspectRatio;
        }

        // Center the image on the page
        const x = (pageWidth - pdfWidth) / 2;
        const y = (pageHeight - pdfHeight) / 2;

        // Add the image to the PDF
        pdf.addImage(img, "PNG", x, y, pdfWidth, pdfHeight);

        // Download the PDF
        pdf.save("admit-card.pdf");
      };
    }
  };

  const handleDownloadImage = () => {
    if (admitCardBlob) {
      downloadFile(admitCardBlob, "admit-card.png", "image/png");
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
            setAdmitCardImage(null); // Reset image on level change
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
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-3xl animate-slideUp transition-all">
          {admitCardImage ? (
            <img src={admitCardImage} alt="Admit Card" className="w-full" />
          ) : (
            <div className="flex items-center justify-center h-64">
              {selectedLevel && error ? (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow-md">
                  <p className="font-semibold">
                    Admit Card Not Found. Please contact support for assistance.
                  </p>
                </div>
              ) : selectedLevel ? (
                "Loading Admit Card..."
              ) : (
                "Please select Level"
              )}
            </div>
          )}
        </div>
      </div>

      {/* Download Buttons */}
      {admitCardImage && (
        <div className="flex flex-col md:flex-row justify-center items-center mt-4 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 w-fit text-center text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={handleDownloadImage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <Download size={16} />
            Download Image
          </button>
        </div>
      )}
    </div>
  );
};

export default AdmitCard;