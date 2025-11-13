The first issue discussed is the failure of bulk student uploading via CSV files, where the system shows zero students uploaded despite the file containing data.

The third issue involves the student address template, which is not correctly reflecting subjects or allowing for proper data entry, possibly due to undefined templates

The discussion begins with clarifying the filtering options for student data, including basic and advanced selections for exams and subjects, noting that specific subjects like IQKD will appear differently based on the selection.


The final point addresses the need for a delete option for study materials, allowing users to remove incorrectly uploaded PDFs, similar to how the active status is currently displayed.

The user explains an issue where uploaded workbooks, despite being assigned to a specific class, appear in all classes for the selected subject, and requests the addition of PG, LKG, and UKG sections for kindergarten uploads.

The conversation shifts to the admit card functionality, which currently lacks data and needs to be updated to include kindergarten students.

The team discusses the generation of admit cards and a missing preview feature.

They identify the need to add an option for KG students to the admit card system and confirm the overall structure is mostly complete.




1. Login & Upload Module

 Verify that login system works correctly for all users.

 Fix CSV upload issue — currently not uploading student data (shows “0 kindergarten students”).

 Ensure that uploaded CSV files correctly count students (should match 10 students in file).

 Debug page freeze after upload (page not moving forward).

 Check visibility of uploaded data — ensure data displays after upload.

 Verify data saving process (“whether it’s being saved or not”).

 Confirm that uploaded student data appears correctly in database and UI.

🎓 2. ICDS Control / Student Details

 Fix “roll number already exists” error during save.

 Ensure “Edit” functionality works (currently disabled).

 Validate that “Yes/No” status for students is saving correctly.

 Debug why edit or save buttons do not reflect changes.

 Confirm proper linking with Kindergarten category.

🧩 3. Template & Subject Mapping

 Verify that subjects are added correctly to templates.

 Check if “IQ” subject is missing from template — add it if necessary.

 Make sure template definitions are complete and properly linked to subjects.

 Confirm data flow when “Yes” is selected in subject/templatized fields.

🧠 4. Fast Point / Attendance Module

 Review logic for “Fast Point” data loading and filtering.

 Ensure attendance data fetches properly after “Select Exam.”

 Validate subject filters — only one IQ subject should appear among five subjects.

 Confirm advanced and basic levels remain identical in structure.

 Fix issue where data fetch is not triggering.

 Enable list generation for subject-specific data.

🏫 5. Participation List

 Add participation list functionality for Kindergarten students (PG, LKG, UKG).

 Align participation list logic with existing “1 to 12” class system.

 Implement dropdown for Kindergarten class → Sections: PG / LKG / UKG.

 Add Kindergarten participation options in existing module.

 Sync filters between upper classes and Kindergarten participation list.

 Ensure data is fetched school-wise and student-wise.

 Fix missing school feed issue in participation list (add missing school IDs).

 Confirm proper filtering and coding for all class levels.

📚 6. Study Material Module

 Add “Delete” or “Remove” option for uploaded PDFs (for wrong uploads).

 Ensure file status (Active/Inactive) shows correctly.

 Enable admins to delete or deactivate files at any time.

 Test PDF upload for different classes.

 Fix issue where class filter is not applying (Math showing in all classes).

 Add Kindergarten sub-sections (PG / LKG / UKG) under class dropdown.

 Validate that uploads appear only in their respective class/section.

🪪 7. Admit Card Module

 Extend admit card generation to include Kindergarten students.

 Use same logic and coding as “1–12” admit card system.

 Fetch data correctly for KG students.

 Ensure preview and print functions work for all class levels.

 Confirm admit card generation and download works for all classes.

⚙️ 8. Final Integration & Deployment

 Re-test all modules after fixes (Login, Upload, Study Material, Participation, Admit Card).

 Deploy updated version to the live server after 2–4 days of final checks.

 Clear old upload and test data after verification.

 Validate that all CSV uploads, templates, and participation data sync with backend database.

 Ensure new options (dropdowns, filters, class mappings) are visible and functional.

 Perform final QA to ensure smooth end-to-end workflow.

🧑‍💻 9. Follow-up / Post-Launch Tasks

 Confirm all previously pending data (~1500–2000 entries) successfully uploaded.

 Monitor for new errors after live deployment.

 Collect feedback from end users after 2–4 days.

 Schedule second review meeting after completion of all tasks.