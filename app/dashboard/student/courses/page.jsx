"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";

export default function StudentCourseListPage() {
  const { data: session, status } = useSession();
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // classes cache per course title
  const [classesByCourse, setClassesByCourse] = useState({});
  const [openCourse, setOpenCourse] = useState(null);

  useEffect(() => {
    async function load() {
      if (status === "loading") return;
      setLoading(true);

      if (status !== "authenticated" || !session?.user?.email) {
        setAssignedCourses([]);
        setLoading(false);
        return;
      }

      try {
        const email = session.user.email;
        const { data: student, error } = await supabase
          .from("student_list")
          .select("id, course, level")
          .eq("email", email)
          .single();

        if (error || !student) {
          console.error("Failed to fetch student row:", error);
          setAssignedCourses([]);
          setLoading(false);
          return;
        }

        const rawCourse = student.course;
        const rawLevel = student.level;

        // parse courses robustly
        let coursesArray = [];
        if (!rawCourse) coursesArray = [];
        else if (Array.isArray(rawCourse)) coursesArray = rawCourse.map((c) => String(c).trim()).filter(Boolean);
        else if (typeof rawCourse === "string") {
          try {
            const parsed = JSON.parse(rawCourse);
            if (Array.isArray(parsed)) coursesArray = parsed.map((c) => String(c).trim()).filter(Boolean);
            else coursesArray = rawCourse.split(",").map((s) => s.trim()).filter(Boolean);
          } catch {
            coursesArray = rawCourse.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } else {
          coursesArray = [String(rawCourse)];
        }

        // parse levels robustly
        let levelsArray = [];
        if (!rawLevel) levelsArray = [];
        else if (Array.isArray(rawLevel)) levelsArray = rawLevel.map((l) => String(l).trim());
        else if (typeof rawLevel === "string") {
          try {
            const parsedL = JSON.parse(rawLevel);
            if (Array.isArray(parsedL)) levelsArray = parsedL.map((l) => String(l).trim());
            else levelsArray = rawLevel.split(",").map((s) => s.trim());
          } catch {
            levelsArray = rawLevel.split(",").map((s) => s.trim());
          }
        } else {
          levelsArray = [String(rawLevel)];
        }

        const final = coursesArray.map((title, idx) => {
          const level = levelsArray[idx] ?? (levelsArray[0] ?? "Not specified");
          return { title, level, studentId: student.id };
        });

        setAssignedCourses(final);
      } catch (err) {
        console.error("Unexpected error loading student courses:", err);
        setAssignedCourses([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // fetch classes for a given course (only known columns - no `description`)
  const fetchClassesFor = useCallback(async (courseTitle, level) => {
    setClassesByCourse((m) => ({ ...m, [courseTitle]: { loading: true, error: null, items: [] } }));
    try {
      const { data: classes, error } = await supabase
        .from("classlist")
        // only request columns that exist in your table to avoid column-not-found errors
        .select("id, class_name, level, date, time, meet_link, coach")
        .ilike("class_name", courseTitle)
        .eq("level", level)
        .order("date", { ascending: true });

      if (error) throw error;

      setClassesByCourse((m) => ({ ...m, [courseTitle]: { loading: false, error: null, items: classes || [] } }));
    } catch (err) {
      console.error("Error fetching classes for", courseTitle, err);
      setClassesByCourse((m) => ({ ...m, [courseTitle]: { loading: false, error: err.message || "Failed", items: [] } }));
    }
  }, []);

  const toggleOpenCourse = (course) => {
    if (openCourse === course.title) {
      setOpenCourse(null);
      return;
    }
    setOpenCourse(course.title);
    if (!classesByCourse[course.title]) fetchClassesFor(course.title, course.level);
  };

  // record attendance best-effort and open link immediately
  const handleJoinFast = async (cls, studentId) => {
    if (!session?.user?.email || !cls?.meet_link) {
      alert("Missing session or meet link.");
      return;
    }

    // open immediately in new tab
    const win = window.open(cls.meet_link, "_blank", "noopener,noreferrer");
    if (win) win.focus();

    // send attendance in background
    const payload = JSON.stringify({ classId: cls.id, studentId });
    const endpoint = "/api/record-attendance";
    const blob = new Blob([payload], { type: "application/json" });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, blob);
    } else {
      try {
        await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      } catch (e) {
        console.error("Attendance background failed", e);
      }
    }
  };

  if (status === "loading" || loading) return <p className="text-center mt-10 text-gray-500">Loading courses...</p>;
  if (status !== "authenticated") return <p className="text-center mt-10 text-gray-500">Please sign in to see your courses.</p>;
  if (assignedCourses.length === 0) return <p className="text-center mt-10 text-gray-500">No assigned courses available.</p>;

  // only show upcoming classes (today or future)
  const todayString = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-4">
      {assignedCourses.map((c, i) => {
        const classesState = classesByCourse[c.title] || { loading: false, error: null, items: [] };
        const upcomingItems = (classesState.items || []).filter((cls) => cls.date >= todayString);

        return (
          <Card key={`${c.title}-${i}`} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <p className="text-sm text-gray-500">Assigned by admin</p>
              <CardTitle className="text-lg font-semibold">{c.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-xs text-gray-500 mb-2">Level: {c.level}</p>

              {openCourse === c.title && (
                <div className="mt-3 border rounded-md p-3 bg-gray-50">
                  {classesState.loading && <div className="text-sm text-gray-500">Loading classes…</div>}
                  {classesState.error && <div className="text-sm text-red-500">{classesState.error}</div>}

                  {!classesState.loading && upcomingItems.length === 0 && (
                    <div className="text-sm text-gray-500">No upcoming classes found for this course.</div>
                  )}

                  {!classesState.loading &&
                    upcomingItems.map((cls) => (
                      <div key={cls.id} className="mb-3 p-2 rounded-md hover:bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{cls.class_name}</div>
                            <div className="text-xs text-gray-500">
                              {cls.date} • {cls.time} • {cls.coach}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cls.meet_link ? (
                              <Button onClick={() => handleJoinFast(cls, c.studentId)} className="px-3 py-1">
                                Join
                              </Button>
                            ) : (
                              <Button disabled className="px-3 py-1 bg-gray-200 text-gray-600">
                                No Link
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>

            <CardFooter>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => {
                    // quick join: use first upcoming class with a meet_link (if present)
                    const items = classesByCourse[c.title]?.items || [];
                    const upcoming = items.find((cl) => cl.date >= todayString && cl.meet_link);
                    if (upcoming) {
                      handleJoinFast(upcoming, c.studentId);
                    } else {
                      // if no data yet, fetch and open list
                      toggleOpenCourse(c);
                    }
                  }}
                  className="px-3 py-1 flex-1"
                >
                  Join Meet
                </Button>

                <Button onClick={() => toggleOpenCourse(c)} className="px-3 py-1">
                  {openCourse === c.title ? "Hide Classes" : "View Classes"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
