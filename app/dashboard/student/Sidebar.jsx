"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { student } = useAuth();
  const pathname = usePathname();
  const [imgFailed, setImgFailed] = useState(false); // per-mount fallback flag

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/student" },
    { icon: BookOpen, label: "My Courses", href: "/dashboard/student/courses" },
    { icon: BarChart3, label: "Progress Tracker", href: "/dashboard/student/progress" },
    { icon: Video, label: "Free Demo Class", href: "/dashboard/student/demo-class" },
    { icon: FileText, label: "Assessment", href: "/dashboard/student/assessment" },
    { icon: CalendarClock, label: "Schedule", href: "/dashboard/student/schedule" },
    { icon: CreditCard, label: "Payment", href: "/dashboard/student/Payment" },
    { icon: BrainCircuit, label: "AI-Based Assessment", href: "/dashboard/student/ai-assessment" },
  ];

  const getUserInitials = () => {
    if (!student?.Student_name) return "";
    return student.Student_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Robust avatar source resolver
  const avatarSrc = (avatarValue) => {
    if (!avatarValue) return null;
    // data url or http(s)
    if (avatarValue.startsWith("data:") || avatarValue.startsWith("http://") || avatarValue.startsWith("https://")) {
      return avatarValue;
    }

    // If you store the storage path (e.g. "user/123/foo.jpg"), build the public URL.
    // Two common Supabase public URL formats exist; use the one your project uses.
    // Try the "storage/v1/object/public" route first (works in modern Supabase projects).
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "";
    // Use the storage public path — adjust "avatars" if your bucket name differs
    return `${base}/storage/v1/object/public/assests/${encodeURIComponent(avatarValue)}`;
  };

  // Reset imgFailed if avatar changes (e.g., on login switch)
  React.useEffect(() => {
    setImgFailed(false);
  }, [student?.avatar]);

  return (
    <div
      className={`relative min-h-screen bg-white border-r shadow-sm transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border rounded-full p-1.5 shadow-md hover:bg-gray-50"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors
                    ${isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t">
        <Link
          href="/dashboard/student/profile"
          className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100"
        >
          {student ? (
            <>
              <div
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden"
                style={{ minWidth: 32 }}
              >
                {student.avatar && !imgFailed ? (
                  <img
                    src={avatarSrc(student.avatar)}
                    alt={student.Student_name || "avatar"}
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  // initials fallback
                  <span className="text-sm font-medium text-white select-none">{getUserInitials()}</span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{student.Student_name}</p>
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <Skeleton className="w-8 h-8 rounded-full" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              )}
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
