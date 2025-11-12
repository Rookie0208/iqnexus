import { STUDENT_LATEST } from "../models/newStudentModel.model.js";
import { School } from "../models/schoolModel.js";

const studentCache = {};
const examNameMapping = {
  IQMO: 'IMO',
  IQSO: 'ITST',
  IQEO: 'IENGO',
  IQRO: 'IAO',
  IQGKO: 'IGKO'
};

export const getParticipationFilteredList = async (req, res) => {
  const { schoolCode, classes, sections, exam,examLevel } = req.body;

    console.log("Request body:", req.body);


  try {
    // Find school
    const school = await School.findOne({ schoolCode }) || {};
    const query = {};
    // Build base query
    if(schoolCode ) {
   query.schoolCode = {$in: schoolCode };
}

    if (classes && classes.length > 0) {
      query.class = { $in: classes };
    }

    if (sections && sections.length > 0) {
      query.section = { $in: sections };
    }

// if exam is not selected but examLevel is L2
    if(exam){
    for (const examObj of exam) {
      const examValue = examObj?.value;

      const levelMatch = examValue.match(/(L1|L2)$/);
      const examName = examValue.replace(/(L1|L2)$/, '');

      if (!levelMatch || !examNameMapping[examName]) {
        return res.status(400).json({ message: `Invalid exam format or name: ${examValue}` });
      }

      const examLevel = levelMatch[0]; // L1 or L2
      const oldExamName = examNameMapping[examName];
      const examField = `${oldExamName}${examLevel}`;

      // Directly add each required exam to the query
      query[examField] = "1";
      console.log(query)
    }
    }
            console.log("Advanced exams:");

        if(examLevel==="L2" && !exam){
    
        let advExam= [
          { value: "IAOL2" },
          { value: "ITSTL2" },
          { value: "IENGOL2" },
          { value: "IMOL2" },

        ];
          
    const examConditions = [];
    for (const examObj of advExam) {
  
      const examValue = examObj?.value;
  
      examConditions.push({ [examValue]: "1" });
      // Directly add each required exam to the query

    }
     if (examConditions.length > 0) {
      query["$or"] = examConditions;
    }

    }
    console.log("Query:", query);
    // Fetch students who match ALL exam fields
    const students = await STUDENT_LATEST.find(query);
    return res.status(200).json({ student: students, school });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
