import jsPDF from "jspdf";
import logo from "../assets/logo-dole.png";
import React, { useRef, useState, useEffect } from "react";
import { Paper, Button, Box, Typography, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.")
    ? `http://${hostname}:8000` // Local or LAN development
    : `${window.location.origin}`; // Production (same domain)
export const OBESIGN = ({ data, onClose }) => {
  const navigate = useNavigate();
  const sigCanvas = useRef(null);
  const [signature, setSignature] = useState(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [pdfUri, setPdfUri] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const handleSave = () => {
    if (sigCanvas.current) {
      const sigData = sigCanvas.current.toDataURL("image/png");
      setSignature(sigData);
    }
  };
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    onClose();
  };
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (err) => reject("❌ Failed to load image: " + err);
      img.src = url;
    });
  };

  // Load either OIC or Chief signature (prefer OIC)
  useEffect(() => {
    const oicSignaturePath = data?.official_business?.oic_signature;
    const chiefSignaturePath = data?.official_business?.chief_signature;
    const selectedSignaturePath = oicSignaturePath || chiefSignaturePath;

    if (!selectedSignaturePath) {
      console.log("❌ No signature path found");
      setSignatureDataUrl(null);
      return;
    }

    const signatureFilename = selectedSignaturePath.replace(
      "images/signatures/",
      ""
    );
    const fullUrl = `${API_BASE_URL}/cors-signature/${signatureFilename}`;

    loadImageAsBase64(fullUrl)
      .then((dataUrl) => {
        setSignatureDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("❌ Failed to load signature image:", err);
        setSignatureDataUrl(null);
      });
  }, [data]);

  // Generate PDF once signature is ready
  useEffect(() => {
    if (!data) return;

    const expectsSignature =
      data?.official_business?.oic_signature ||
      data?.official_business?.chief_signature;

    if (expectsSignature && signatureDataUrl === null) {
      return; // Wait for signature to load
    }

    const pdf = generatePDF();
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUri(url);
  }, [data, signatureDataUrl]);

  // PDF generation code

  // Sample data
  // Creating the itinerary data dynamically from network response
  const itineraryData = {
    from: data?.official_business?.travel_from || "Unknown",
    to: data?.official_business?.travel_to || "Unknown",
    departure: data?.official_business?.departure_date
      ? new Date(data.official_business.departure_date).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        )
      : "Unknown",

    expectedReturn: data?.official_business?.expected_return
      ? new Date(data.official_business.expected_return).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        )
      : "Unknown",

    purpose: data?.official_business?.purpose || "No purpose provided",
    dateOfBusiness: data?.official_business?.date_of_business || "Unknown", // Added here
  };

  const generatePDF = () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [612, 468],
    });

    const names =
      (data?.employees || []).map(
        (emp) =>
          `${emp.first_name?.toUpperCase() || ""} ${
            emp.last_name?.toUpperCase() || ""
          }`
      ) || [];

    pdf.rect(10, 10, 592, 448);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("HRDS-PAD", 25, 20, { align: "left" });
    pdf.text("Form No. 07", 25, 30, { align: "left" });
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.text("(Revised, January 2015)", 25, 40, { align: "left" });
    pdf.line(100, 10, 100, 50);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("OFFICIAL BUSINESS FORM", 200, 30, { align: "center" });
    pdf.line(300, 10, 300, 125);

    pdf.addImage(logo, "PNG", 320, 13, 40, 30);

    pdf.setFontSize(6);
    pdf.setFont("times", "bold");
    pdf.text("Republic of the Philippines", 440, 20, { align: "center" });
    pdf.text("DEPARTMENT OF LABOR AND EMPLOYMENT", 440, 27, {
      align: "center",
    });
    pdf.setFont("times", "normal");
    pdf.text("Regional Office No. X", 440, 34, { align: "center" });
    pdf.text("NORTHERN MINDANAO", 440, 41, { align: "center" });
    pdf.line(10, 50, 602, 50);

    // Employee details
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Name of Employee(s):", 20, 60);

    const yStart = 70;
    const rowHeight = 10;
    const col1X = 40;
    const col2X = 150;

    names.forEach((emp, idx) => {
      const isLeft = idx < 3;
      const nameX = isLeft ? col1X : col2X;
      const positionX = nameX + 270;
      const y = yStart + (idx % 3) * rowHeight;

      // Get the position from the original data using the index
      const position = data?.employees[idx]?.position_name || "Unknown"; // Fallback in case position is missing

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`${idx + 1}. ${emp}`, nameX, y); // Now emp is just the name string
      pdf.text(position, positionX, y); // Display the employee position
    });

    pdf.text("Position:", 310, 60);
    pdf.line(10, 100, 602, 100);

    pdf.setFont("helvetica", "bold");
    pdf.text("Office:", 20, 112);
    pdf.setFontSize(14);
    pdf.text("DOLE-X", 60, 113);
    pdf.line(150, 100, 150, 125);
    pdf.setFontSize(10);
    pdf.text("Division:", 160, 112);
    pdf.setFontSize(14);
    pdf.text("CDO-FO", 210, 113);
    pdf.text("Date of Official Business:", 310, 112);
    pdf.text(itineraryData.dateOfBusiness, 490, 113); // Display value

    pdf.line(10, 125, 602, 125);

    pdf.setFontSize(10);
    pdf.line(10, 140, 602, 140);
    pdf.text("Itinerary/Destination:", 110, 135);

    pdf.text("Time:", 420, 135); // Adjusted x position (increased from 310 to 380)

    pdf.text("From:", 20, 152);
    pdf.text(itineraryData.from, 50, 152); // Display sample 'From' data
    pdf.line(150, 140, 150, 175); // Line to separate fields

    pdf.text("To:", 160, 152);
    pdf.text(itineraryData.to, 180, 152); // Display sample 'To' data
    pdf.line(300, 125, 300, 175); // Line to separate fields

    pdf.text("Departure:", 310, 152);
    pdf.text(itineraryData.departure, 380, 152); // Display sample departure date
    pdf.line(440, 140, 440, 175); // Line to separate fields
    pdf.text("Expected Return:", 450, 152);
    pdf.text(itineraryData.expectedReturn, 540, 152); // Adjusted x position and display value of expectedReturn

    pdf.line(10, 175, 602, 175);
    pdf.text("Purpose:", 20, 187);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(itineraryData.purpose, 80, 187);
    pdf.line(10, 220, 602, 220);

    pdf.text("Employees Signature", 120, 265);
    pdf.line(300, 220, 300, 280);

    const name = data?.official_business?.chief_name || "N/A";
    const signaturePath =
      data?.official_business?.oic_signature ||
      data?.official_business?.chief_signature;

    pdf.text("Approved by:", 310, 232);
    const signatureX = 400;
    const signatureY = 240;
    // Conditionally show FOR: label only if using OIC signature
    if (data?.official_business?.oic_signature) {
      pdf.setFontSize(10);
      pdf.text("FOR:", signatureX, signatureY - 6);
    }

    // Add signature image above name (using Base64 data)
    if (signatureDataUrl) {
      try {
        // Force JPEG format for better compatibility with PDF.js preview
        pdf.addImage(signatureDataUrl, "JPEG", 433, 210, 33, 50);
      } catch (error) {
        console.error("❌ Error adding signature image:", error);
        // Fallback: try PNG format
        try {
          pdf.addImage(signatureDataUrl, "PNG", 433, 210, 33, 50);
        } catch (pngError) {
          console.error("❌ PNG format also failed:", pngError);
          pdf.setFont("helvetica", "normal");
          pdf.text("(Signature)", 433, 230);
        }
      }
    } else {
      // Add placeholder when no signature is loaded
      pdf.setFont("helvetica", "normal");
      pdf.text("(No signature)", 433, 230);
    }

    // Add name below the signature - use dynamic name from data
    pdf.setFont("helvetica", "bold");
    pdf.text(name, 405, 250);

    pdf.text("Head of Office or Authorized Representative", 360, 265);

    // if (signature) {
    //   pdf.addImage(signature, "PNG", 128, 150, 70, 15);
    // }

    pdf.setFontSize(10);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(10, 270, 592, 15, "FD");
    pdf.line(10, 270, 602, 270);
    pdf.text(
      "TO BE FILLED BY THE AGENCY OR COMPANY WHERE BUSINESS IS TRANSACTED",
      110,
      280
    );
    pdf.line(10, 285, 602, 285);
    pdf.setFont("helvetica", "bold");
    pdf.text("CERTIFICATE OF APPEARANCE", 230, 297);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "This is to certify that the person whose name is shown above personally appeared in this office as indicated and for",
      50,
      315
    );
    pdf.text("the purpose stated.", 40, 325);
    pdf.line(10, 360, 602, 360);
    pdf.text(
      "Signature over Printed Name of Officer or Authorized Signatory and Designation",
      135,
      355
    );
    pdf.line(125, 345, 500, 345);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("INSTRUCTIONS:", 20, 370);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "1. Employees are required to accomplish an official business (OB) form prior to their participation and/or attendance to official functions such as meetings, field",
      30,
      380
    );
    pdf.text(
      "   assignment. Approved/signed OB slips must be attached to the DTRs/bundy cards upon submission to the Human Resource Development Service (HRDS)",
      30,
      390
    );
    pdf.text(
      "   or the Personnel Unit of the Internal Management Services Division (IMSD) of each regional office.",
      30,
      400
    );
    pdf.text(
      "   Employees who attended trainings or seminars are required to submit a copy of their certificate of attendance/appearance to such in lieu of the OB form.",
      30,
      410
    );
    pdf.text(
      "2. An OB is applicable only for one (1) day regardless of the duration and/or start/end time of the business, except warranted.",
      30,
      420
    );
    pdf.text(
      "3. Failure to submit the duly approved OB forms or certificate of attendance/appearance shall be a ground for deduction from the vacation leave credits.",
      30,
      430
    );
    pdf.text(
      "   Such deduction shall be counted as tardiness, under time or whole day absence, whichever is applicable.",
      30,
      440
    );
    pdf.text(
      "4. Employees must ensure that the Certificate of Appearance in this form is duly signed by the agency or company where business is transacted.",
      30,
      450
    );

    return pdf;
  };

  const handleDownload = () => {
    const pdf = generatePDF();
    pdf.save("official_business_form.pdf");
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" align="center" fontWeight={500} gutterBottom>
        Official Business Form
      </Typography>
      <Paper>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <iframe
            title="PDF Preview"
            src={pdfUri}
            style={{
              width: isMobile ? "100%" : "100%",
              height: "500px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      </Paper>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "10px",
          justifyContent: "center",
          mb: 1,
        }}
      >
        <Button variant="contained" onClick={handleDownload}>
          Download
        </Button>
        <Button variant="contained" aria-label="close" onClick={handleClose}>
          Cancel
        </Button>
      </Box>
    </Container>
  );
};
