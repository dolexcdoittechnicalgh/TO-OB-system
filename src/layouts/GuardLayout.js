import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/ContextProvider";

const GuardLayout = () => {
  const { userRole, isLoading } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && userRole !== "guard") {
      navigate("/unauthorized");
    }
  }, [userRole, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>; // Optional: customize loading UI
  }

  return (
    <div className="admin-layout">
      <div className="flex">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default GuardLayout;
