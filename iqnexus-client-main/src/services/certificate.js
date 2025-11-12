import nodeHtmlToImage from "node-html-to-image";
import fs from "fs";

export default async function generateCertificate(info) {
  await nodeHtmlToImage({
    output: `../outputs/certificate_${info.name}.png`,
    html: fs.readFileSync("../designs/certificate.html", "utf8"),
    content: {
      name: info.name,
      father: info.fatherName,
      mother: info.mother,
      class: info.class,
      section: info.section,
      school: info.school,
      city: info.city,
      nationalRank: info.nationalRank,
      cityRank: info.cityRank,
      classRank: info.classRank,
      date: info.date,
      rollNo: info.rollNo,
    },
    puppeteerArgs: {
      defaultViewport: {
        width: 1100,
        height: 800,
      },
    },
    type: "png",
    quality: 100,
  });

  console.log(`Certificate generated: certificate_${info.name}.png`);
}

// Example usage:
// generateCertificate({
//   name: "Mahak",
//   fatherName: "Anil Kumar",
//   mother: "Sharda Devi",
//   class: "5",
//   section: "A",
//   school: "S. J. Education Centre",
//   city: "Kanpur",
//   nationalRank: "347",
//   cityRank: "157",
//   classRank: "5",
//   date: "9 November 2024",
//   rollNo: "16100605",
// });
