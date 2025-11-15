"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Bell, Menu, ChevronDown, LogOut, BookOpen, GraduationCap, Globe } from "lucide-react";

import { useSession, signOut } from "next-auth/react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const router = useRouter();
  const { student: ctxUser, setStudent } = useAuth?.() ?? {}; // safe access if context exists
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync NextAuth session into AuthContext (optional, keeps legacy parts working)
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      try {
        setStudent?.(session.user);
        localStorage.setItem("studentSession", JSON.stringify(session.user));
      } catch (e) {
        /* ignore localStorage errors */
      }
    } else if (status === "unauthenticated") {
      setStudent?.(null);
      try {
        localStorage.removeItem("studentSession");
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user]);

  // Prefer NextAuth session user; fallback to context user (legacy)
  const user = session?.user ?? ctxUser ?? null;

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout using NextAuth signOut, with a fallback to your legacy endpoint
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      setStudent?.(null);
      localStorage.removeItem("studentSession");
      router.push("/");
    } catch (err) {
      console.error("signOut failed, trying legacy logout", err);
      try {
        await fetch("/api/auth/student/logout", { method: "POST" });
        setStudent?.(null);
        localStorage.removeItem("studentSession");
        router.push("/");
      } catch (e) {
        console.error("legacy logout failed", e);
      }
    }
  };

  const getUserInitials = () => {
    if (!user || !user.name) return "AZ";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getNavItems = () => [{ label: "My Learning", icon: BookOpen, href: "/dashboard/student" }];

  const avatarRing = "ring-blue-600 ring-offset-2";

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 bg-white ${isScrolled ? "shadow-sm" : ""}`}>
      <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href={user ? "/dashboard/student" : "/"} className="flex items-center space-x-2">
          <img src="/Azroute.jpeg" alt="Azroute Logo" className="h-20 w-34 object-contain" />
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Button variant="ghost" asChild className="font-medium text-gray-700 hover:text-blue-600">
            <Link href="/explore" className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Explore
            </Link>
          </Button>

          <Button variant="ghost" asChild className="font-medium text-gray-700 hover:text-blue-600">
            <Link href="/teachers" className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              Our Coaches
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-6">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100/80">
                  <Avatar className={`h-8 w-8 ring ${avatarRing}`}>
                    {user?.image ? <AvatarImage src={user.image} alt={user.name} /> : <AvatarFallback>{getUserInitials()}</AvatarFallback>}
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="p-4">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                {getNavItems().map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="h-4 w-4 mr-3 text-gray-500" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-3" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" className="font-medium text-gray-700 hover:text-blue-600" onClick={() => router.push("/auth/student/login")}>
                Log In
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium" onClick={() => router.push("/auth/student/signup")}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
