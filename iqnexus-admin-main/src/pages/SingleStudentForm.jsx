import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../Api";

const SingleStudentForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    // Map true/false to "1"/"0" for exam fields
    const examFields = [
      "IAOL1",
      "IAOL1Book",
      "ITSTL1",
      "ITSTL1Book",
      "IMOL1",
      "IMOL1Book",
      "IGKOL1",
      "IGKOL1Book",
      "IENGOL1",
      "IENGOL1Book",
      "IAOL2",
      "ITSTL2",
      "IMOL2",
      "IENGOL2"
    ];
    examFields.forEach((field) => {
      data[field] = data[field] === "true" ? "1" : "0";
    });

    try {
      const response = await axios.post(`${BASE_URL}/add-student`, data);
      console.log(response.data);
      alert(response.data.message);
      reset();
    } catch (err) {
      console.error("Error submitting form", err);
      alert("Failed to add student");
    }
  };

  // Mapping for UI display names
  const examFieldDisplayNames = {
    IAOL1: "IQROL1",
    IAOL1Book: "IQROL1 Book",
    ITSTL1: "IQSOL1",
    ITSTL1Book: "IQSOL1 Book",
    IMOL1: "IQMOL1",
    IMOL1Book: "IQMOL1 Book",
    IGKOL1: "IQGKOL1",
    IGKOL1Book: "IQGKOL1 Book",
    IENGOL1: "IQEOL1",
    IENGOL1Book: "IQEOL1 Book",
    IAOL2: "IQROL2",
    ITSTL2: "IQSOL2",
    IMOL2: "IQMOL2",
    IENGOL2: "IQEOL2"
  };

  return (
    <div className="min-h-screen bg-gray-50 py-0 md:py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Student Registration
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Complete the form below to register a new student
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roll No
                    </label>
                    <input
                      type="text"
                      {...register("rollNo", {
                        required: "Roll No is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter roll number"
                    />
                    {errors.rollNo && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.rollNo.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Code
                    </label>
                    <input
                      type="number"
                      {...register("schoolCode", {
                        required: "School Code is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter school code"
                    />
                    {errors.schoolCode && (
                      <p className="text-red-500 text-xs mt-1">
                        School Code is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class
                    </label>
                    <input
                      type="text"
                      {...register("class", { required: "Class is required" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter class"
                    />
                    {errors.class && (
                      <p className="text-red-500 text-xs mt-1">
                        Class is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      {...register("section", {
                        required: "Section is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter section"
                    />
                    {errors.section && (
                      <p className="text-red-500 text-xs mt-1">
                        Section is required
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      {...register("studentName", {
                        required: "Student Name is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter student name"
                    />
                    {errors.studentName && (
                      <p className="text-red-500 text-xs mt-1">
                        Student Name is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register("dob", { required: "DOB is required" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-xs mt-1">
                        Date of Birth is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father Name
                    </label>
                    <input
                      type="text"
                      {...register("fatherName", {
                        required: "Father Name is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter father's name"
                    />
                    {errors.fatherName && (
                      <p className="text-red-500 text-xs mt-1">
                        Father Name is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mother Name
                    </label>
                    <input
                      type="text"
                      {...register("motherName", {
                        required: "Mother Name is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter mother's name"
                    />
                    {errors.motherName && (
                      <p className="text-red-500 text-xs mt-1">
                        Mother Name is required
                      </p>
                    )}
                  </div>

                  <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      {...register("mobNo", {
                        required: "Mobile number is required",
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter mobile number (e.g., 7880450475)"
                    />
                    {errors.mobNo && (
                      <p className="text-red-500 text-xs mt-1">
                        Mobile number is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parents Working School
                    </label>
                    <input
                      type="text"
                      {...register("ParentsWorkingschool")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter parents' working school"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      {...register("designation")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter designation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      {...register("city")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                      placeholder="Enter city"
                    />
                  </div>
                </div>
              </div>

              {/* Exam Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Exam Information
                </h3>

                {/* Basic Exam Information */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-indigo-600 mb-3">
                    Basic Exam Information (Level 1)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      "IAOL1",
                      "IAOL1Book",
                      "ITSTL1",
                      "ITSTL1Book",
                      "IMOL1",
                      "IMOL1Book",
                      "IGKOL1",
                      "IGKOL1Book",
                      "IENGOL1",
                      "IENGOL1Book"
                    ].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {examFieldDisplayNames[field]}
                        </label>
                        <select
                          {...register(field, {
                            required: `${examFieldDisplayNames[field]} is required`,
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                        >
                          <option value="">Select</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                        {errors[field] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[field].message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Exam Information */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-indigo-600 mb-3">
                    Advanced Exam Information (Level 2)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["IAOL2", "ITSTL2", "IMOL2", "IENGOL2"].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {examFieldDisplayNames[field]}
                        </label>
                        <select
                          {...register(field, {
                            required: `${examFieldDisplayNames[field]} is required`,
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                        >
                          <option value="">Select</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                        {errors[field] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[field].message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment and Other Exam Details */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-indigo-600 mb-3">
                    Payment and Other Exam Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      "totalBasicLevelParticipatedExams",
                      "basicLevelFullAmount",
                      "basicLevelAmountPaid",
                      "basicLevelAmountPaidOnline",
                      "isBasicLevelConcessionGiven",
                      "concessionReason",
                      "remark",
                      "bookStatus",
                      "advanceLevelAmountPaid",
                      "advanceLevelAmountPaidOnline",
                      "totalAmountPaid",
                      "totalAmountPaidOnline",
                    ].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          {...register(field, {
                            required: `${field} is required`,
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                          placeholder={`Enter ${field.toLowerCase()}`}
                        />
                        {errors[field] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[field].message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
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
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
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

export default SingleStudentForm;