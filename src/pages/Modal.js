import React, { useState, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import "./Modal.css";

const CalendarModal = ({ events = [], onClose }) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Approved");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.classList.remove("modal-open");
    };
  }, []);

  const filterEmployees = (employees, term) => {
    if (!term) return employees;
    return employees.filter((emp) =>
      `${emp.first_name} ${emp.last_name}`
        .toLowerCase()
        .includes(term.toLowerCase())
    );
  };
  const sampleEvent = {
    allDay: false,
    end: new Date("Sat May 17 2025 08:00:00 GMT+0800"),
    resource: {
      employees: [
        { first_name: "Jhonel", last_name: "Mira" },
        { first_name: "Roy", last_name: "Bug-os" },
      ],
      record: {
        approved_at: null,
        created_at: "2025-05-17 02:48:03",
        date_of_business: "2025-05-17",
        departure_date: "2025-05-17",
        division: "CDO-FO",
        expected_return: "2025-05-17",
        id: 2,
        office: "DOLE-X",
        purpose: "Tumapagon",
        remarks: null,
        status: "pending",
        travel_from: "DOLE-X",
        travel_to: "Lapasan",
        updated_at: "2025-05-17 02:48:03",
        travel_by_air: 0,
        travel_by_land: 0,
        travel_by_water: 0,
        travel_start_date: "2025-05-17",
        travel_end_date: "2025-05-17",
      },
    },
    type: "OB",
    start: new Date("Sat May 17 2025 08:00:00 GMT+0800"),
    status: "pending",
    title: "OB - Jhonel Mira, Roy Bug-os",
  };

  // Suppose events is an array of such event objects

  // Prepare categories
  const categories = {
    "TRAVEL ORDER": [],
    "OFFICIAL BUSINESS": [],
    "PASS SLIP": [],
  };

  const typeToCategory = {
    TO: "TRAVEL ORDER",
    OB: "OFFICIAL BUSINESS",
    PS: "PASS SLIP", // adjust if needed
  };

  // Group events by category and filter by activeTab & search
  /*************  ✨ Windsurf Command 🌟  *************/
  events.forEach((evt) => {
    const eventType = evt.type || evt.resource?.type || "PS";
    const category = typeToCategory[eventType] || "PASS SLIP";

    // Ensure status matches the current tab
    const status = evt.status?.toLowerCase();
    const normalizedStatus = status === "pendingadmin" ? "pending" : status;

    if (normalizedStatus === activeTab.toLowerCase()) {
      const employees = evt.employees || evt.resource?.employees || [];
      const filteredEmployees = filterEmployees(employees, search);
      const employeeCount = filteredEmployees.length;

      const record = evt.record || evt.resource?.record || {};
      const isOB = eventType === "OB";
      const isTO = eventType === "TO";
      const isPS = eventType === "PS";

      const title = `${eventType} - ${employeeCount} Employee${
        employeeCount !== 1 ? "s" : ""
      }`;

      const employeeDetails = filteredEmployees.map((emp) => ({
        name: `${emp.first_name} ${emp.last_name}`,
        location: isOB
          ? record.travel_to || "N/A"
          : isPS
          ? record.place_to_visit || "N/A"
          : record.destination || "N/A",
        purpose: record.purpose || record.reason || "N/A",
        remarks: record.remarks || "N/A",
        travelByAir: isTO ? record.travel_by_air === 1 : false,
        travelByLand: isTO ? record.travel_by_land === 1 : false,
        travelByWater: isTO ? record.travel_by_water === 1 : false,
        travelStart: isPS
          ? record.time_start
            ? record.time_start.split(" ")[1]
            : "N/A"
          : record.travel_start_date || "N/A",
        travelEnd: isPS
          ? record.time_end
            ? record.time_end.split(" ").slice(1).join(" ")
            : "N/A"
          : record.travel_end_date || "N/A",
      }));

      categories[category].push({
        title,
        employees: employeeDetails,
        remarks: record.remarks || "N/A",
      });
    }
  });
  /*******  5ade93b9-7cef-4d8d-9c57-7930a0f395f0  *******/

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: "100vw", width: "fit-content" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ position: "relative" }}>
          <h2 style={{ marginBottom: "10px" }}>Events Details</h2>

          <div className="tabs">
            {["Pending", "Approved", "Declined"].map((tab) => {
              const isActive = activeTab === tab;

              // Define the background color for active tabs
              let backgroundColor = "#ddd"; // default for inactive tabs

              if (isActive) {
                if (tab === "Approved") backgroundColor = "#4caf50"; // green
                else if (tab === "Pending")
                  backgroundColor = "#ff9800"; // orange
                else if (tab === "Declined") backgroundColor = "#f44336"; // red
              }

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    backgroundColor: backgroundColor,
                    color: isActive ? "white" : "black",
                    marginRight: "10px",
                    cursor: "pointer",
                    borderRadius: "5px",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              marginLeft: "auto",
              top: windowWidth < 480 ? "10px" : "0px",
              maxWidth: "100%",
            }}
          >
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "35px",
                paddingRight: "10px",
                border: "1px solid #ccc",
                borderRadius: "20px",
                height: "36px",
                width: windowWidth < 480 ? "90vw" : "200px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <FaSearch
              style={{
                position: "absolute",
                left: "10px",
                color: "gray",
                pointerEvents: "none",
              }}
            />
          </div>

          <FaTimes
            className="close-icon"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              fontSize: "24px",
              cursor: "pointer",
              color: "#FFF",
              zIndex: 1000,
            }}
          />
        </div>

        {/* Display events grouped by category */}
        {Object.entries(categories).map(([category, records], idx) => (
          <div
            key={idx}
            className="table-section"
            style={{
              marginTop: idx === 0 ? "30px" : "60px",
              fontSize: "12px", // 👈 smaller base font
              lineHeight: "1.4",
            }}
          >
            <h3
              className="table-title"
              style={{
                fontSize: "13px", // smaller heading
                marginBottom: "8px",
              }}
            >
              {category}
            </h3>

            <div className="table-container">
              {records.length > 0 ? (
                records.map((record, index) => (
                  <div
                    key={index}
                    className="table-row"
                    style={{
                      marginBottom: "2px",
                      fontSize: "12px",
                    }}
                  >
                    <strong style={{ fontSize: "12px" }}>{record.title}</strong>
                    <div
                      style={{
                        color: "red",
                      }}
                    >
                      {record.employees.length > 0 ? (
                        record.employees.map((emp, i) => (
                          <div
                            key={i}
                            style={{
                              marginRight: "100px",
                            }}
                          >
                            <span>
                              <b>{emp.name}</b>
                            </span>{" "}
                            — <span>Destination: {emp.location}</span> —{" "}
                            <span>Purpose: {emp.purpose}</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ marginLeft: "10px", fontSize: "11px" }}>
                          No employees found.
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    fontSize: "11px",
                  }}
                >
                  No records found.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarModal;
