import jsPDF from "jspdf";
import logo from "../assets/logo-dole.png";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  const formattedDate = date.toLocaleDateString("en-US", options);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return `${formattedDate} ${time}`;
};

export const generatePDF = (formData) => {
  const doc = new jsPDF();

  // outer box
  doc.rect(10, 10, 190, 270); // (x, y, width, height)

  // Add logo (centered)
  doc.addImage(logo, "PNG", 40, 15, 22, 20);

  // Add header text (centered)
  doc.setFontSize(12);
  doc.setFont("times new roman", "normal");
  doc.text("Republic of the Philippines", 115, 20, { align: "center" });
  doc.setFont("times new roman", "bold");
  doc.text("DEPARTMENT OF LABOR AND EMPLOYMENT", 115, 25, { align: "center" });
  doc.setFont("times new roman", "normal");
  doc.text("Regional Office No. X", 115, 30, { align: "center" });
  doc.text("NORTHERN MINDANAO", 115, 35, { align: "center" });

  // Add TO no. and Numbered by box
  // TO No. should be incremented!!
  doc.rect(138, 40, 50, 15);
  doc.setFontSize(12);
  doc.text("TO No.: CDO-2025-____", 140, 45);
  doc.text("Numbered by: _____", 140, 50);

  // MEMORANDUM title
  doc.setFontSize(14);
  doc.setFont("times new roman", "bold");
  doc.text("MEMORANDUM", 20, 70);

  // Add requester information
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`FOR           :`, 20, 80);
  doc.setFont("helvetica", "bold");
  doc.text(`${formData.requester.name || ""}`, 50, 80);

  doc.setFont("helvetica", "normal");
  doc.text(`RE             :`, 20, 90);
  doc.setFont("helvetica", "bold");
  doc.text(`${formData.re}`, 50, 90);

  doc.setFont("helvetica", "normal");
  doc.text(`DATE        :`, 20, 100);
  doc.setFont("helvetica", "bold");
  doc.text(`${formData.date}`, 50, 100);

  // Separating line
  doc.line(20, 105, 190, 105);

  // Employee details
  if (formData.employees && formData.employees.length > 0) {
    // Extract names and join them with commas
    const employeeNames = formData.employees
      .map((employee) => `${employee.name || ""}`)
      .join(", ");

    // Wrap employee names
    const wrappedNames = doc.splitTextToSize(employeeNames, 130); // Adjust width to fit

    doc.setFont("helvetica", "normal");
    doc.text(`NAME  :`, 20, 115);
    doc.setFont("helvetica", "bold");
    doc.text(wrappedNames, 50, 115);

    // Calculate dynamic Y position based on how many lines the name used
    const nameSectionHeight = 115 + wrappedNames.length * 7;

    // Now all sections below will shift automatically
    doc.setFont("helvetica", "normal");
    doc.text(`DURATION OF TRAVEL  :`, 20, nameSectionHeight + 3);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${formatDate(formData.travelFrom)} - ${formatDate(formData.travelTo)}`,
      80,
      nameSectionHeight + 3
    );

    doc.setFont("helvetica", "normal");
    doc.text(`TRAVEL BY  :`, 20, nameSectionHeight + 13);
    doc.setFont("helvetica", "bold");
    const selectedTravelBy =
      Object.keys(formData.travelBy)
        .filter((key) => formData.travelBy[key])
        .join(", ") || "N/A";
    doc.text(selectedTravelBy, 60, nameSectionHeight + 13);

    doc.setFont("helvetica", "normal");
    doc.text(`DESTINATION  :`, 20, nameSectionHeight + 23);
    doc.setFont("helvetica", "bold");
    doc.text(`${formData.destination}`, 70, nameSectionHeight + 23);

    doc.setFont("helvetica", "normal");
    doc.text(`PURPOSE  :`, 20, nameSectionHeight + 33);
    doc.setFont("helvetica", "bold");
    const wrappedPurpose = doc.splitTextToSize(formData.purpose || "", 130);
    doc.text(wrappedPurpose, 60, nameSectionHeight + 33);

    doc.setFont("helvetica", "normal");
    doc.text(`RECORD OF PREVIOUS TRAVEL(S)  :`, 20, nameSectionHeight + 43);
    doc.setFont("helvetica", "bold");
    doc.text(`${formData.previousTravel}`, 100, nameSectionHeight + 43);

    // Approved By Section stays fixed (or you can also shift it if you want)
    doc.setFont("helvetica", "normal");
    doc.text("APPROVED BY :", 20, 195);
    doc.setFont("helvetica", "bold");
    const textWidth = doc.getTextWidth("EMMANUEL G. TOLEDO");
    const x = 120;
    const y = 215;
    doc.text("EMMANUEL G. TOLEDOs", x, y);
    doc.line(x, y + 1, x + textWidth, y + 1);
    doc.setFont("helvetica", "italic");
    doc.text("Chief LEO", 133, 220);
  }
  // Instruction Box
  doc.line(10, 260, 200, 260);
  doc.setFontSize(8);
  doc.setFont("times new roman", "normal");
  doc.text(
    "INSTRUCTION: Division Chiefs shall prepare this form three (3) \n copies which must be attached to Appendix once approved",
    13,
    265
  );
  doc.line(92, 280, 92, 260); //divides the instruction and note
  doc.text("Note: ", 95, 265);
  doc.rect(105, 262, 4, 4); // Checkbox for "On Official Time only"
  doc.text("On Official Time only (No Claim)", 110, 265);
  doc.rect(105, 267, 4, 4); // Checkbox for "Live-in Activity"
  doc.text("Live-in Activity (1 day before-1 day after claim only)", 110, 270);
  doc.rect(105, 272, 4, 4); // Checkbox for "May use the official vehicle"
  doc.text("May use the official vehicle", 110, 275);
  doc.rect(153, 262, 4, 4); // Checkbox for "Others"
  doc.text("Others:_____________________", 158, 265);

  // Create a Blob from the PDF data
  const pdfOutput = doc.output("blob");

  // Create a new Blob URL
  const pdfUrl = URL.createObjectURL(pdfOutput);

  // Open the PDF in a new tab
  const newTab = window.open(pdfUrl, "_blank");

  // Check if the new tab was blocked
  if (!newTab) {
    alert("Please allow popups for this website to view the PDF.");
  }

  // Optionally, you can create a download link in the new tab
  const downloadLink = document.createElement("a");
  downloadLink.href = pdfUrl;
  downloadLink.download = "[TOform]YourSurname.pdf"; // Set the desired file name
  downloadLink.innerText = "Download PDF";
  downloadLink.style.display = "block";
  downloadLink.style.margin = "20px";
  downloadLink.style.textAlign = "center";

  // Append the download link to the new tab's document
  newTab.document.body.appendChild(downloadLink);
};
