import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../Api";

const KinderGartenStudentForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/add-kindergarten-student`, data);
    alert(response.data.message);
    reset();
  } catch (err) {
    console.error("Error submitting form", err);
    alert("Failed to add student");
  }
};

  const inputField = ({ label, name, type = "text", required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        {...register(name, required ? { required: `${label} is required` } : {})}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Kindergarten Student Registration
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Fill out all fields to register a kindergarten student.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-10">
            {/* Section: Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inputField({ label: "Roll No", name: "rollNo", required: true })}
                {inputField({ label: "School Code", name: "schoolCode", type: "number", required: true })}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    {...register("Class", { required: "Class is required" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                  >
                    <option value="">Select</option>
                    <option value="KD">KD</option>
                  </select>
                  {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    {...register("section", { required: "Section is required" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                  >
                    <option value="">Select</option>
                    <option value="LK">LK</option>
                    <option value="UK">UK</option>
                    <option value="PG">PG</option>
                  </select>
                  {errors.Duplicates && <p className="text-red-500 text-xs mt-1">{errors.section.message}</p>}
                </div>
              </div>
            </div>

            {/* Section: Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inputField({ label: "Student Name", name: "studentName", required: true })}
                {inputField({ label: "Father Name", name: "fatherName" })}
                {inputField({ label: "Mother Name", name: "motherName" })}
                {inputField({ label: "Date of Birth", name: "dob", type: "date" })}
                {inputField({ label: "Mobile No", name: "mobNo" })}
              </div>
            </div>

            {/* Section: Exam Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IQKD Book</label>
                  <select
                    {...register("iqkdBook")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                  >
                    <option value="">Select</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inputField({ label: "Total Basic Level Participated Exams", name: "totalBasicLevelParticipatedExams" })}
                 {inputField({ label: "Basic Level Full Amount", name: "basicLevelFullAmount" })}
                {inputField({ label: "Basic Level Paid Amount ", name: "basicLevelAmountPaid" })}
                {inputField({ label: "Is Basic Level Concession Given", name: "isBasicLevelConcessionGiven" })}
                {inputField({ label: "Concession Reason", name: "concessionReason" })}
                {inputField({ label: "Parents Working School", name: "ParentsWorkingschool" })}
                {inputField({ label: "Designation", name: "designation" })}
                {inputField({ label: "City", name: "city"})}
                {inputField({ label: "Advance Level Paid Amount", name: "advanceLevelAmountPaid" })}
                {inputField({ label: "Advance Level Amount Paid Online", name: "advanceLevelAmountPaidOnline" })}
                {inputField({ label: "Total Amount Paid", name: "totalAmountPaid" })}
                {inputField({ label: "Total Amount Paid Online", name: "totalAmountPaidOnline" })}                                    
              </div>
            </div>


            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KinderGartenStudentForm;
