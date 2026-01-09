import React, { useState, useEffect } from "react";
import { Container, IconButton, Box } from "@mui/material";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./calendar.css";
import CalendarModal from "./Modal";
import { CalendarFooter, CalendarHeader } from "./CalendarFunctions";
import { fetchCalendarEvents } from "../api";

const localizer = momentLocalizer(moment);

const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div className="calendar-header">
      <div className="header-container">
        <div className="month-navigation">
          <button className="nav-btn" onClick={() => onNavigate("PREV")}>
            <FaChevronLeft />
          </button>
          <span className="month-display">{label}</span>
          <button className="nav-btn" onClick={() => onNavigate("NEXT")}>
            <FaChevronRight />
          </button>
        </div>
        <IconButton className="add-btn" href="/to-form">
          <FaPlus />
        </IconButton>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Handle responsive breakpoints - matching your CSS breakpoints
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 570);
      setIsTablet(window.innerWidth > 570 && window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetchCalendarEvents();
        const rawEvents = response.data;

        const transformedEvents = rawEvents.map((item) => {
          const { type, record, employees } = item;

          const employeeNames = employees
            .map((emp) => `${emp.first_name} ${emp.last_name}`)
            .join(", ");

          const title = `${type} - ${employeeNames}`;

          let start, end;

          if (type === "TO") {
            start = new Date(record.travel_from);
            end = new Date(record.travel_to);
          } else if (type === "PS") {
            start = new Date(record.time_start);
            end = new Date(record.time_end);
          } else {
            start = new Date(record.departure_date);
            end = new Date(record.expected_return);
          }

          return {
            title,
            start,
            end,
            allDay: false,
            status: record.status || "Pending",
            resource: item,
          };
        });

        setEvents(transformedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    loadEvents();
  }, []);

  const closeDayModal = () => setSelectedDayEvents([]);
  const handleEventClick = (event) => setSelectedEvent(event);
  const closeModal = () => setSelectedEvent(null);

  const eventPropGetter = (event) => {
    let className = "";
    if (event.status === "Pending") className = "pending";
    if (event.status === "Approved") className = "approved";
    if (event.status === "Declined") className = "declined";
    return { className };
  };

  const handleDayClick = (slotInfo) => {
    const clickedDate = slotInfo.start;

    const eventsForDay = events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === clickedDate.getFullYear() &&
        eventDate.getMonth() === clickedDate.getMonth() &&
        eventDate.getDate() === clickedDate.getDate()
      );
    });

    if (eventsForDay.length > 0) {
      setSelectedDayEvents(eventsForDay);
    }
  };

  // Responsive calendar height - matching your CSS structure
  const getCalendarHeight = () => {
    if (isMobile) return 350;
    if (isTablet) return 450;
    return 600;
  };

  // Responsive calendar views
  const getCalendarViews = () => {
    if (isMobile) {
      return ["month", "agenda"];
    }
    return ["month", "week", "day", "agenda"];
  };

  // Responsive default view
  const getDefaultView = () => {
    return isMobile ? "month" : "month";
  };

  const calendarStyle = {
    height: getCalendarHeight(),
    fontSize: isMobile ? "12px" : "14px",
  };

  return (
    <Box className="calendar">
      <div className="calendar-container">
        <div className="calendar-header-container">
          <h2 className="calendar-title">Calendar of Activities</h2>
          <button
            className="admin-login-btn"
            onClick={() => navigate("/login")}
          >
            Admin Login
          </button>
        </div>

        <CalendarHeader />

        <div className="scrollable-container">
          <Container className="calendar-content" maxWidth={false}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={calendarStyle}
              selectable
              onSelectSlot={handleDayClick}
              onSelectEvent={handleEventClick}
              views={getCalendarViews()}
              defaultView={getDefaultView()}
              popup={isMobile}
              popupOffset={isMobile ? { x: 10, y: 10 } : undefined}
              components={{
                toolbar: CustomToolbar,
                header: CalendarHeader,
                footer: CalendarFooter,
              }}
              eventPropGetter={(event) => ({
                style: {
                  fontSize: isMobile ? "10px" : "11px",
                  padding: isMobile ? "1px 2px" : "2px 4px",
                  lineHeight: isMobile ? "1.2" : "1.4",
                },
              })}
              dayLayoutAlgorithm="no-overlap"
              step={60}
              showMultiDayTimes={!isMobile}
              rtl={false}
              formats={{
                dayHeaderFormat: isMobile ? "ddd" : "dddd MMM DD",
                dayRangeHeaderFormat: ({ start, end }, culture, localizer) => {
                  if (isMobile) {
                    return (
                      localizer.format(start, "MMM DD", culture) +
                      " - " +
                      localizer.format(end, "MMM DD", culture)
                    );
                  }
                  return (
                    localizer.format(start, "MMMM DD", culture) +
                    " - " +
                    localizer.format(end, "MMMM DD", culture)
                  );
                },
                monthHeaderFormat: isMobile ? "MMM YYYY" : "MMMM YYYY",
              }}
            />

            <div className="right-panel">
              <div className="legend">
                <p>LEGENDS:</p>
                <div className="legend-item">
                  <span className="legend-color approved"></span>
                  <span className="legend-text">Approved</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color pending"></span>
                  <span className="legend-text">Pending</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color declined"></span>
                  <span className="legend-text">Declined</span>
                </div>
              </div>

              <div className="note">
                <p>
                  <strong>Note:</strong>
                </p>
                <p>
                  To request a travel order or official business, kindly click
                  the "+" button to proceed.
                </p>
              </div>
            </div>
          </Container>
        </div>

        {selectedEvent && (
          <CalendarModal events={[selectedEvent]} onClose={closeModal} />
        )}
        {selectedDayEvents.length > 0 && (
          <CalendarModal
            events={selectedDayEvents}
            onClose={closeDayModal}
            isMultiple
          />
        )}
        <CalendarFooter />
      </div>
    </Box>
  );
};

export default CalendarPage;
