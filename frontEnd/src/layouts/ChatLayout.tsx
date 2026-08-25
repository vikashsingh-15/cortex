import React from "react";
import { Link, Outlet } from "react-router";
import { ToastContainer, toast } from 'react-toastify';


export default function ChatLayout() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 p-3 dark:from-slate-950 dark:to-slate-900">
      <Outlet />
      <ToastContainer />
    </div>
  );
}
