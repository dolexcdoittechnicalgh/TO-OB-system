import jsPDF from "jspdf";
import logo from "../assets/dole-logo.png";

// ✅ Helper Functions
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return date.toLocaleDateString("en-US", options);
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { hour: "numeric", minute: "numeric", hour12: true };
  return date.toLocaleTimeString("en-US", options);
};

// ✅ Dynamically detect environment
const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.")
    ? `http://${hostname}:8000` // Local or LAN
    : `${window.location.origin}`; // Production

// ✅ Example dynamic values
const obData = {
  head_position_name: "JHONEL G. MIRA",
  head_position_signature: "images/signatures/6856097c04d15_Untitled-1.png",
};

// Fallback values
const nameText = obData?.head_position_name || "Approved by:";

// ✅ Ensure proper slash handling in the URL
const normalizedSignaturePath = obData?.head_position_signature.replace(
  /^\/+/,
  ""
);
const signatureImagePath = `${API_BASE_URL}/${normalizedSignaturePath}`;

export const generateOBPDF = (obData, requesterData, signatureDataArray) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [612, 468],
  });

  doc.rect(10, 10, 592, 448);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("HRDS-PADs", 25, 20, { align: "left" });
  doc.text("Form No. 07", 25, 30, { align: "left" });
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("(Revised, January 2015)", 25, 40, { align: "left" });
  doc.line(100, 10, 100, 50);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL BUSINESS FORM", 200, 30, { align: "center" });
  doc.line(300, 10, 300, 125);

  doc.addImage(logo, "PNG", 320, 13, 40, 30);

  doc.setFontSize(6);
  doc.setFont("times", "bold");
  doc.text("Republic of the Philippines", 440, 20, { align: "center" });
  doc.text("DEPARTMENT OF LABOR AND EMPLOYMENT", 440, 27, { align: "center" });
  doc.setFont("times", "normal");
  doc.text("Regional Office No. X", 440, 34, { align: "center" });
  doc.text("NORTHERN MINDANAO", 440, 41, { align: "center" });
  doc.line(10, 50, 602, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Name of Employee:", 20, 60);
  doc.text("Position:", 310, 60);

  if (obData.employees && obData.employees.length > 0) {
    const employeeNames = obData.employees
      .map((employee) => employee.name || "")
      .join(", ");
    const employeePositions = [
      ...new Set(obData.employees.map((employee) => employee.position || "")),
    ]
      .filter((pos) => pos)
      .join(", ");

    doc.setFont("helvetica", "bold");

    const maxWidth = 250;
    const wrappedNames = doc.splitTextToSize(employeeNames, maxWidth);
    const wrappedPositions = doc.splitTextToSize(employeePositions, maxWidth);

    doc.text(wrappedNames, 25, 75);
    doc.text(wrappedPositions, 310, 75);
  } else {
    doc.setFont("helvetica", "bold");
    doc.text("N/A", 25, 75);
    doc.text("N/A", 310, 75);
  }

  doc.line(10, 100, 602, 100);

  doc.text("Office:", 20, 112);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(obData.office || "", 60, 113);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.line(150, 100, 150, 125);
  doc.text("Division:", 160, 112);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(obData.division || "", 210, 113);
  doc.setFontSize(10);
  doc.text("Date of Official Business:", 310, 112);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(formatDate(obData.dateOfBusiness) || "", 440, 113);
  doc.line(10, 125, 602, 125);

  doc.setFontSize(10);
  doc.line(10, 140, 602, 140);
  doc.text("Itinerary/Destination", 110, 135);
  doc.text("Time", 310, 135);
  doc.text("From:", 20, 152);
  doc.line(150, 140, 150, 175);
  doc.setFontSize(14);
  doc.text(obData.itineraryFrom || "", 60, 155);
  doc.setFontSize(10);
  doc.text("To:", 160, 152);
  doc.line(300, 125, 300, 175);
  doc.setFontSize(14);
  doc.text(obData.itineraryTo || "", 190, 155);
  doc.setFontSize(10);
  doc.text("Departure:", 310, 152);
  doc.setFontSize(14);
  doc.text(formatTime(obData.departureDate) || "", 365, 155);
  doc.line(440, 140, 440, 175);
  doc.setFontSize(10);
  doc.text("Expected Return:", 450, 152);
  doc.setFontSize(14);
  doc.text(formatTime(obData.expectedReturn) || "", 540, 155);

  doc.setFontSize(10);
  doc.line(10, 175, 602, 175);
  doc.text("Purpose:", 20, 187);
  doc.text(obData.purpose || "", 25, 200);
  doc.line(10, 220, 602, 220);

  let signatureYPosition = 210; // Adjust to move signatures above "Employee's Signature"
  const signatureXStart = 30; // Start position for first signature
  const signatureWidth = 120; // Adjust width to fit properly
  const signatureHeight = 40; // Adjust height for proper visibility
  const spacingX = 180; // Space between signatures in a row
  const maxPerRow = 3; // Number of signatures per row

  signatureDataArray.forEach((signatureData, index) => {
    if (signatureData && signatureData.startsWith("data:image/png;base64,")) {
      const col = index % maxPerRow; // Arrange in columns
      const row = Math.floor(index / maxPerRow); // Arrange in rows if needed

      const currentX = signatureXStart + col * spacingX;
      const currentY = signatureYPosition + row * 50; // Adjust for multiple rows

      // Add the signature image
      doc.addImage(
        signatureData,
        "PNG",
        currentX,
        currentY,
        signatureWidth,
        signatureHeight
      );
    } else {
      console.error(`Signature ${index + 1} is missing or invalid.`);
      doc.text(
        `Signature ${index + 1} Error`,
        signatureXStart + (index % maxPerRow) * spacingX,
        signatureYPosition
      );
    }
  });

  // Assume obData and signatureYPosition are already defined
  const nameText = obData?.head_position_name || "Approved by:";
  const nameWidth = doc.getTextWidth(nameText);
  const nameX = 398;
  const nameY = 252;

  // ✅ Draw Employee's Signature label below signature area
  doc.text("Employee's Signature", 120, signatureYPosition + 60);
  doc.line(120, signatureYPosition + 65, 260, signatureYPosition + 65);

  // ✅ Draw vertical line and "Approved by:" text
  doc.line(300, 220, 300, 280); // vertical separator
  doc.text("Approved bys:", 310, 232);

  // ✅ Draw dynamic head name
  doc.text(nameText, nameX, nameY);
  doc.line(nameX, nameY + 2, nameX + nameWidth, nameY + 2); // line under the name

  // ✅ Label below the head signature
  doc.text("Head of Office or Authorized Representative", 360, 265);

  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 270, 592, 15, "FD");
  doc.line(10, 270, 602, 270);
  doc.text(
    "TO BE FILLED BY THE AGENCY OR COMPANY WHERE BUSINESS IS TRANSACTED",
    110,
    280
  );
  doc.line(10, 285, 602, 285);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF APPEARANCE", 230, 297);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is to certify that the person whose name is shown above personally appeared in this office as indicated and for",
    50,
    315
  );
  doc.text("the purpose stated.", 40, 325);
  doc.line(10, 360, 602, 360);
  doc.text(
    "Signature over Printed Name of Officer or Authorized Signatory and Designation",
    135,
    355
  );
  doc.line(125, 345, 500, 345);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("INSTRUCTIONS:", 20, 370);
  doc.setFont("helvetica", "normal");
  doc.text(
    "1. Employees are required to accomplish an official business (OB) form prior to their participation and/or attendance to official functions such as meetings, field",
    30,
    380
  );
  doc.text(
    "  assignment. Approved/signed OB slips must be attached to the DTRs/bundy cards upon submission to the Human Resource Development Service (HRDS)",
    30,
    390
  );
  doc.text(
    "  or the Personnel Unit of the Internal Management Services Division (IMSD) of each regional office.",
    30,
    400
  );
  doc.text(
    "  Employees who attended trainings or seminars are required to submit a copy of their certificate of attendance/appearance to such in lieu of the OB form.",
    30,
    410
  );
  doc.text(
    "2. An OB is applicable only for one (1) day regardless of the duration and/or start/end time of the business, except warranted.",
    30,
    420
  );
  doc.text(
    "3. Failure to submit the duly approved OB forms or certificate of attendance/appearance shall be a ground for deduction from the vacation leave credits.",
    30,
    430
  );
  doc.text(
    "  Such deduction shall be counted as tardiness, under time or whole day absence, whichever is applicable.",
    30,
    440
  );
  doc.text(
    "4. Employees must ensure that the Certificate of Appearance in this form is duly signed by the agency or company where business is transacted.",
    30,
    450
  );

  const pdfOutput = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfOutput);
  const newTab = window.open(pdfUrl, "_blank");

  if (!newTab) {
    alert("Please allow popups for this website to view the PDF.");
  }

  const downloadLink = document.createElement("a");
  downloadLink.href = pdfUrl;
  downloadLink.download = "[OBform]YourSurname.pdf";
  downloadLink.innerText = "Download PDF";
  downloadLink.style.display = "block";
  downloadLink.style.margin = "20px";
  downloadLink.style.textAlign = "center";

  newTab.document.body.appendChild(downloadLink);
};
