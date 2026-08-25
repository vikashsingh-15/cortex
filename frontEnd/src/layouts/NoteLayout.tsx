import { logoutUser } from "@/api/auth";
import UserAvatar from "@/components/base/UserAvatar";
import ThemeToggle from "@/components/base/ThemeToggle";
import { getUserData } from "@/helper/getUserData";
import React, { useState, useRef, useEffect } from "react";
import { Link, Outlet } from "react-router";

export default function NoteLayout() {
 

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Left: Logo + Title */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            NotebookLM
          </span>
        </Link>

        {/* Right: Avatar & Menu */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserAvatar />
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-6 ">
        <Outlet />
      </main>
    </div>
  );
}
