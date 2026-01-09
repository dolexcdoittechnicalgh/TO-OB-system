import React, { useState, useEffect, useRef, useMemo } from "react";
import { DialogContent, Box, Button } from "@mui/material";
import { jsPDF } from "jspdf";
import logo from "../assets/logo-dole.png";

export const GeneratePassSlipPDF = ({ data = {}, onClose }) => {
  const [pdfUri, setPdfUri] = useState("");
  const [pdfBlob, setPdfBlob] = useState(null); // Store the PDF blob
  const [signature, setSignature] = useState(null);
  const dataRef = useRef(null);
  const hasGenerated = useRef(false);
  const hostname = window.location.hostname;

  const generatePDF = async (formData) => {
    const ps = formData.pass_slip;
    const headName = ps?.head_position_name || "N/A";
    const oicSignaturePath = ps?.oic_signature;
    const chiefSignaturePath = ps?.chief_signature;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [480, 468],
    });

    // Function to convert image URL to base64 and draw it

    const API_BASE_URL =
      hostname === "localhost" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
        ? `http://${hostname}:8000` // Local or LAN
        : `${window.location.origin}`; // Production

    const loadImageAsBase64 = async (url) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("❌ Failed to fetch or convert image:", error);
        return null;
      }
    };

    const selectedSignaturePath = oicSignaturePath || chiefSignaturePath;

    // Load signature first if available
    let signatureBase64 = null;
    if (selectedSignaturePath) {
      const filename = selectedSignaturePath.split("/").pop();
      const fullUrl = `${API_BASE_URL}/cors-signature/${filename}`;

      try {
        signatureBase64 = await loadImageAsBase64(fullUrl);
      } catch (error) {
        console.error("❌ Error loading signature image:", error);
      }
    }

    // Example signature placement
    const signatureX = 400;
    const signatureY = 240;

    const employees = formData.employees || [];
    const names = employees.map((emp) => {
      const firstName = emp?.first_name?.toUpperCase() || "";
      const middleName = emp?.middle_name ? emp.middle_name.toUpperCase() : "";
      const lastName = emp?.last_name?.toUpperCase() || "";

      return [firstName, middleName, lastName]
        .filter((name) => name.trim() !== "")
        .join(" ");
    });

    const staticData = {
      name: names.length > 0 ? names.join(", ") : "JOHN DOE",
      position: ps.position_name || "Software Engineer",
      date: ps.time_start?.split(" ")[0] || "N/A",
      startDate: ps.time_start?.split(" ")[1] || "09:00",
      endDate: ps.time_end?.split(" ")[1] || "18:00",
      placeToVisit: formData.place_to_visit || "Head Office",
      reason: formData.reason || "Meeting with Client",
      actualDeparture: ps.actual_time_departure?.split(" ")[1] || "N/A",
      actualArrival: ps.actual_time_arrival?.split(" ")[1] || "N/A",
    };

    const finalFormData = {
      ...formData,
      name: staticData.name,
    };

    const safeText = (text, x, y) => {
      if (typeof text !== "string") {
        console.error(`Invalid text value: ${text}`);
        text = "";
      }
      if (typeof x !== "number" || typeof y !== "number") {
        console.error(`Invalid coordinates: x = ${x}, y = ${y}`);
        return;
      }
      pdf.text(text, x, y);
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    const formattedDate = finalFormData.date || "";
    safeText(formattedDate, 320, 108);

    const formatTime = (timeString) => {
      if (!timeString) return "";
      const [hours, minutes] = timeString.split(":");
      if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return "";
      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    };

    const createdAt = finalFormData?.pass_slip?.created_at;
    let createdAtInWords = "";

    if (createdAt) {
      const date = new Date(createdAt);
      const options = { year: "numeric", month: "long", day: "numeric" };
      createdAtInWords = date.toLocaleDateString("en-US", options);
    }

    const formatTimeOnly = (dateTimeString) => {
      if (!dateTimeString || typeof dateTimeString !== "string")
        return "Not specified";
      try {
        const trimmed = dateTimeString.trim();
        const formattedDateTimeString = trimmed.includes("T")
          ? trimmed
          : trimmed.replace(" ", "T");

        const date = new Date(formattedDateTimeString);

        if (isNaN(date.getTime())) throw new Error("Invalid Date");

        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        console.error(
          "Error formatting time:",
          e,
          "Input was:",
          dateTimeString
        );
        return "Not specified";
      }
    };

    const formatDateTime = (dateString, timeString) => {
      if (typeof dateString !== "string" || typeof timeString !== "string")
        return "";

      const formattedTime = formatTime(timeString);
      if (!formattedTime) return "";

      const [year, month, day] = dateString.split("-");
      if (
        isNaN(parseInt(year)) ||
        isNaN(parseInt(month)) ||
        isNaN(parseInt(day))
      )
        return "";

      const dateTimeString = `${dateString}T${formattedTime}:00`;
      const date = new Date(dateTimeString);

      if (isNaN(date.getTime())) {
        console.error("Invalid date or time:", dateString, timeString);
        return "";
      }

      return date.toLocaleString();
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.rect(10, 10, 418, 446);
    pdf.addImage(logo, "PNG", 20, 15, 35, 33);

    pdf.text("Department of Labor and Employment", 215, 22, {
      align: "center",
    });
    pdf.text("Regional Office No. X", 215, 33, { align: "center" });
    pdf.text("INDIVIDUAL PASS/TIME ADJUSTMENT SLIP", 215, 60, {
      align: "center",
    });

    pdf.line(10, 63, 428, 63);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("To be filled up by the requesting Employee", 215, 71, {
      align: "center",
    });

    pdf.line(10, 75, 428, 75);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bolditalic");
    pdf.text("FOR PERSONAL PURPOSES ONLY", 215, 84, { align: "center" });

    safeText(finalFormData.name, 20, 108);
    safeText("Employee and Signature", 20, 122);

    const underlineLength = 180;
    pdf.line(20, 110, 20 + underlineLength, 110);

    safeText(formattedDate, 340, 108);
    const underlineLengthDate = 80;
    pdf.line(320, 110, 320 + underlineLengthDate, 110);
    safeText(createdAtInWords, 325, 108);
    safeText("Date", 340, 119);

    pdf.setFont("helvetica", "bold");
    safeText("PERMISSION IS REQUESTED TO:", 20, 150);
    pdf.line(20, 151, 180, 151);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Leave the office premises during office hours from:", 40, 170);

    const departureTime = formatTimeOnly(finalFormData?.pass_slip?.time_start);
    safeText(`Intended time of Departure:`, 80, 190);
    safeText(departureTime || "", 200, 190);
    pdf.line(180, 192, 250, 192);

    const arrivalTime = formatTimeOnly(finalFormData?.pass_slip?.time_end);
    safeText(`Intended time of Arrival:`, 80, 200);
    safeText(arrivalTime, 200, 200);
    pdf.line(180, 202, 250, 202);

    const X = 220;
    const Y = 440;

    const ExceededTime = finalFormData?.pass_slip?.time_exceeded;
    const hasExceeded = ExceededTime !== "00:00:00" && ExceededTime !== null;

    const displayTime = hasExceeded ? ExceededTime : "";

    if (hasExceeded) {
      pdf.setTextColor(255, 0, 0); // 🔴 Red color
      safeText(`${displayTime} (Time exceeded)`, X, Y, pdf);
      pdf.setTextColor(0, 0, 0); // Reset to black
    } else {
      safeText("", X, Y, pdf); // Nothing to show if not exceeded
    }

    safeText("Deviate from my fixed time of arrival", 40, 220);
    safeText("From: ", 80, 235);
    pdf.line(105, 235, 188, 235);
    safeText("to ", 190, 235);
    pdf.line(200, 235, 270, 235);
    safeText("(Fixed Time) ", 80, 245);

    safeText("Office/Place to be Visited:", 20, 280);
    pdf.line(140, 282, 390, 282);
    safeText(
      finalFormData.pass_slip?.place_to_visit || "No place to visit Provided",
      160,
      280
    );

    safeText("Reason:", 20, 300);
    pdf.line(70, 302, 390, 302);
    pdf.line(20, 315, 390, 315);
    safeText(finalFormData.pass_slip?.reason || "No reason provided", 85, 300);

    safeText("Approved by:", 20, 340);
    const fontSize = 10;
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", "bold");

    const chiefName = data?.pass_slip?.chief_name || "N/A";
    const textWidth = pdf.getTextWidth(chiefName);

    // You can center at X = 305, or change as needed
    const centerX = 305;
    const textX = centerX - textWidth / 2;

    pdf.text(chiefName, textX, 370);

    pdf.line(textX, 372, textX + textWidth + 5, 372);
    // Example signature placement
    const signatureXFor = 260;
    const signatureYFor = 360;

    if (signatureBase64) {
      // Show "FOR:" only if using OIC signature
      if (oicSignaturePath) {
        pdf.setFont("helvetica", "normal"); // Ensure the font is not bold
        pdf.setFontSize(8); // Smaller font
        pdf.text("FOR:", signatureXFor, signatureYFor - 6);
      }

      // Add signature image

      pdf.addImage(signatureBase64, "PNG", 285, 330, 33, 50);
    } else {
      console.warn("⚠️ No signature image available for PDF");
    }

    pdf.setFont("helvetica", "normal");
    safeText("(Head of Office/Authorized Representative)", 220, 382);

    pdf.rect(20, 395, 398, 15);
    pdf.setFontSize(9);
    safeText("To be filled up by the guard", 165, 405);
    pdf.setFontSize(10);

    // Actual time of Departure
    const ActualTimeDep = formatTimeOnly(
      finalFormData?.pass_slip?.actual_time_departure
    );

    // Draw the label
    safeText("Actual time of Departure:", 20, 425);

    // Draw the underline
    pdf.line(140, 427, 390, 427);

    // Check if "Not specified" was returned from the formatter
    if (ActualTimeDep === "Not specified") {
      const textWidth = pdf.getTextWidth(ActualTimeDep);
      const x = 220 - textWidth;
      safeText(ActualTimeDep, x, 425); // Right-align fallback
    } else {
      safeText(ActualTimeDep, 150, 425); // Display the formatted time
    }

    // Actual time of Arrival
    const ActualTimeArrival = formatTimeOnly(
      finalFormData?.pass_slip?.actual_time_arrival
    );

    // Draw the label
    safeText("Actual time of Arrival:", 20, 440);

    // Draw the underline
    pdf.line(140, 442, 390, 442);

    // Check if "Not specified" was returned from the formatter
    if (ActualTimeArrival === "Not specified") {
      const textWidth = pdf.getTextWidth(ActualTimeArrival);
      const x = 220 - textWidth;
      safeText(ActualTimeArrival, x, 440); // Right-align fallback
    } else {
      safeText(ActualTimeArrival, 150, 440); // Display the formatted time
    }
    pdf.line(140, 442, 390, 442);

    // Return both blob and URL
    const pdfBlobResult = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlobResult);

    return { blob: pdfBlobResult, url: pdfUrl };
  };

  const handleDataChange = async (newData) => {
    if (
      newData &&
      Object.keys(newData).length > 0 &&
      dataRef.current !== newData &&
      !hasGenerated.current
    ) {
      try {
        const result = await generatePDF(newData);
        setPdfUri(result.url);
        setPdfBlob(result.blob);

        dataRef.current = newData;
        hasGenerated.current = true;
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  useMemo(() => {
    if (data) {
      handleDataChange(data);
    }
  }, [data]);

  const handleDownload = async () => {
    try {
      let blobToDownload = pdfBlob;

      // If no cached blob, generate new one
      if (!blobToDownload) {
        console.log("No cached PDF blob, generating new one...");
        const result = await generatePDF(data);
        blobToDownload = result.blob;
      }

      if (!blobToDownload) {
        console.error("PDF generation failed");
        return;
      }

      const pdfUrl = URL.createObjectURL(blobToDownload);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "PassSlip.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <DialogContent>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <h3>Pass Slip</h3>
        {pdfUri ? (
          <iframe
            src={pdfUri}
            width="100%"
            height="500px"
            frameBorder="0"
            title="Pass Slip PDF"
          />
        ) : (
          <p>Loading PDF...</p>
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button variant="contained" color="primary" onClick={handleDownload}>
            Download
          </Button>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </DialogContent>
  );
};
