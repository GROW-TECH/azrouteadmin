"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";

import { BookOpen, Clock } from "lucide-react";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";

/**
 * StudentProgressPage
 * - Overview: overall attendance % + per-course progress chart
 * - Detailed: per-course cards -> expand to timeline of classes (join, mark absent)
 *
 * NOTE: Server should accept status in /api/record-attendance if you want Mark Absent to work.
 */

export default function StudentProgressPage() {
  const { data: session, status } = useSession();

  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percent: 0,
  });
  const [perCourse, setPerCourse] = useState([]); // [{ title, level, total, present, absent, percent, classes }]
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  // UI state
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState({}); // title -> { classes, attendanceMap }
  const [joiningId, setJoiningId] = useState(null);
  const [history, setHistory] = useState([]); // recent attendance rows
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      if (status === "loading") return;
      setLoading(true);

      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        // student row
        const { data: student, error: studentErr } = await supabase
          .from("student_list")
          .select("id, course, level")
          .eq("email", session.user.email)
          .single();

        if (studentErr || !student) {
          console.error("Failed to fetch student:", studentErr);
          if (!mounted) return;
          setSummary({ total: 0, present: 0, absent: 0, percent: 0 });
          setPerCourse([]);
          setLoading(false);
          return;
        }

        const studentId = student.id;
        const rawCourse = student.course;
        const rawLevel = student.level;

        // parse courses -> array
        let coursesArray = [];
        if (!rawCourse) coursesArray = [];
        else if (Array.isArray(rawCourse)) coursesArray = rawCourse.map((c) => String(c).trim()).filter(Boolean);
        else if (typeof rawCourse === "string") {
          try {
            const parsed = JSON.parse(rawCourse);
            coursesArray = Array.isArray(parsed) ? parsed.map((c) => String(c).trim()).filter(Boolean) : rawCourse.split(",").map((s) => s.trim()).filter(Boolean);
          } catch {
            coursesArray = rawCourse.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } else coursesArray = [String(rawCourse)];

        // parse levels -> array
        let levelsArray = [];
        if (!rawLevel) levelsArray = [];
        else if (Array.isArray(rawLevel)) levelsArray = rawLevel.map((l) => String(l).trim());
        else if (typeof rawLevel === "string") {
          try {
            const parsedL = JSON.parse(rawLevel);
            levelsArray = Array.isArray(parsedL) ? parsedL.map((l) => String(l).trim()) : rawLevel.split(",").map((s) => s.trim());
          } catch {
            levelsArray = rawLevel.split(",").map((s) => s.trim());
          }
        } else levelsArray = [String(rawLevel)];

        const finalCourses = coursesArray.map((title, idx) => {
          const level = levelsArray[idx] ?? (levelsArray[0] ?? "Not specified");
          return { title, level };
        });

        // for each course, fetch classlist and attendance stats
        const statsPromises = finalCourses.map(async (courseObj) => {
          const courseName = courseObj.title;
          const level = courseObj.level;

          const { data: classes = [], error: classErr } = await supabase
            .from("classlist")
            .select("id, class_name, level, date, time, meet_link, coach")
            .ilike("class_name", courseName)
            .eq("level", level)
            .order("date", { ascending: true });

          if (classErr) {
            console.error("Error fetching classes for", courseName, classErr);
            return { title: courseName, level, total: 0, present: 0, absent: 0, percent: 0, classes: [] };
          }

          const classIds = (classes || []).map((c) => c.id).filter(Boolean);
          const total = classIds.length;

          let presentCount = 0;
          let absentCount = 0;
          if (classIds.length > 0) {
            const { data: attends = [], error: attErr } = await supabase
              .from("attendance")
              .select("id, status, class_list_id")
              .in("class_list_id", classIds)
              .eq("student_id", studentId);

            if (attErr) {
              console.error("Error fetching attendance for", courseName, attErr);
            } else {
              presentCount = (attends || []).filter((r) => r.status === "P").length;
              absentCount = (attends || []).filter((r) => r.status === "A").length;
            }
          }

          const percent = total > 0 ? Number(((presentCount / total) * 100).toFixed(1)) : 0;

          return {
            title: courseName,
            level,
            total,
            present: presentCount,
            absent: absentCount,
            percent,
            classes: classes || [],
          };
        });

        const resolved = await Promise.all(statsPromises);

        // aggregate totals
        const overallTotal = resolved.reduce((acc, cur) => acc + (cur.total || 0), 0);
        const overallPresent = resolved.reduce((acc, cur) => acc + (cur.present || 0), 0);
        const overallAbsent = resolved.reduce((acc, cur) => acc + (cur.absent || 0), 0);
        const overallPercent = overallTotal > 0 ? Number(((overallPresent / overallTotal) * 100).toFixed(1)) : 0;

        if (!mounted) return;
        setPerCourse(resolved);
        setSummary({ total: overallTotal, present: overallPresent, absent: overallAbsent, percent: overallPercent });

        // fetch recent attendance history (last 12)
        const { data: hist = [] } = await supabase
          .from("attendance")
          .select("id, status, class_list_id, attendance_date, created_at")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(12);

        if (!mounted) return;
        setHistory(hist || []);
      } catch (err) {
        console.error("Unexpected error loading progress:", err);
        if (!mounted) return;
        setSummary({ total: 0, present: 0, absent: 0, percent: 0 });
        setPerCourse([]);
        setHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [session, status]);

  // Expand course and fetch details (classes + attendanceMap)
  const handleViewClasses = async (courseTitle, level) => {
    if (expandedCourse === courseTitle) {
      setExpandedCourse(null);
      return;
    }

    setExpandedCourse(courseTitle);
    if (courseDetails[courseTitle]) return; // cached

    try {
      const { data: studentRow } = await supabase
        .from("student_list")
        .select("id")
        .eq("email", session.user.email)
        .single();

      const studentId = studentRow?.id;
      if (!studentId) return;

      const { data: classes = [] } = await supabase
        .from("classlist")
        .select("id, class_name, level, date, time, meet_link, coach")
        .ilike("class_name", courseTitle)
        .eq("level", level)
        .order("date", { ascending: true });

      const classIds = (classes || []).map((c) => c.id).filter(Boolean);

      let attendanceMap = {};
      if (classIds.length > 0) {
        const { data: attends = [] } = await supabase
          .from("attendance")
          .select("id, status, class_list_id, created_at")
          .in("class_list_id", classIds)
          .eq("student_id", studentId);

        (attends || []).forEach((a) => {
          attendanceMap[a.class_list_id] = a;
        });
      }

      setCourseDetails((m) => ({ ...m, [courseTitle]: { classes, attendanceMap } }));
    } catch (err) {
      console.error("Error loading course details:", err);
      setCourseDetails((m) => ({ ...m, [courseTitle]: { classes: [], attendanceMap: {} } }));
    }
  };

  // Join and record attendance (present)
  const handleJoinAndRecord = async (cl) => {
    if (!cl?.meet_link) return;
    if (!session?.user?.email) {
      alert("Please sign in to join the class.");
      return;
    }

    setJoiningId(cl.id);
    // open link with cid for tracking
    const safeLink = `${cl.meet_link}${cl.meet_link.includes("?") ? "&" : "?"}cid=${cl.id}`;
    window.open(safeLink, "_blank", "noopener,noreferrer");

    const payload = JSON.stringify({ classId: cl.id });
    const endpoint = "/api/record-attendance";
    const blob = new Blob([payload], { type: "application/json" });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, blob);
        setTimeout(async () => {
          await refreshCourseAndHistory(cl, true);
          setJoiningId(null);
        }, 700);
      } else {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
        if (!res.ok) console.error("Attendance API failed", await res.text());
        await refreshCourseAndHistory(cl, true);
        setJoiningId(null);
      }
    } catch (err) {
      console.error("Attendance record failed:", err);
      setJoiningId(null);
    }
  };

  // Mark absent explicitly (server must accept status 'A')
  const handleMarkAbsent = async (cl) => {
    if (!confirm("Mark this class as Absent? This will create an attendance record with status 'A'.")) return;
    setActionLoading(true);
    try {
      const payload = JSON.stringify({ classId: cl.id, status: "A" });
      const res = await fetch("/api/record-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const body = await res.json();
      if (!res.ok) {
        console.error("Mark absent failed", body);
        alert(body?.error || "Failed to mark absent");
      } else {
        await refreshCourseAndHistory(cl, false);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  // Refresh course details + overall history after attendance change
  const refreshCourseAndHistory = async (cl, reloadCourse = true) => {
    try {
      // get student id
      const { data: studentRow } = await supabase
        .from("student_list")
        .select("id")
        .eq("email", session.user.email)
        .single();
      const studentId = studentRow?.id;

      if (studentId) {
        const { data: hist = [] } = await supabase
          .from("attendance")
          .select("id, status, class_list_id, attendance_date, created_at")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(12);
        setHistory(hist || []);
      }

      // refresh perCourse stats for the course if needed
      if (reloadCourse && cl) {
        // determine course title that has this class id
        const containingCourse = perCourse.find((pc) => (pc.classes || []).some((c) => c.id === cl.id));
        if (containingCourse) {
          // reload that course stats
          const courseTitle = containingCourse.title;
          const lvl = containingCourse.level;
          // clear cache and call handleViewClasses to re-fetch attendance map
          setCourseDetails((m) => ({ ...m, [courseTitle]: undefined }));
          await handleViewClasses(courseTitle, lvl);

          // reload perCourse list by re-running minimal fetch for that course
          try {
            const { data: classes = [] } = await supabase
              .from("classlist")
              .select("id, class_name, level, date, time, meet_link, coach")
              .ilike("class_name", courseTitle)
              .eq("level", lvl)
              .order("date", { ascending: true });

            const classIds = (classes || []).map((c) => c.id).filter(Boolean);
            let presentCount = 0;
            let absentCount = 0;
            if (classIds.length > 0) {
              const { data: attends = [] } = await supabase
                .from("attendance")
                .select("id, status, class_list_id")
                .in("class_list_id", classIds)
                .eq("student_id", studentId);
              presentCount = (attends || []).filter((r) => r.status === "P").length;
              absentCount = (attends || []).filter((r) => r.status === "A").length;
            }

            const total = classIds.length;
            const percent = total > 0 ? Number(((presentCount / total) * 100).toFixed(1)) : 0;

            setPerCourse((prev) => prev.map((p) => p.title === courseTitle ? { ...p, classes, total, present: presentCount, absent: absentCount, percent } : p));
            // also update summary totals
            const overallTotal = perCourse.reduce((acc, cur) => acc + (cur.title === courseTitle ? total : cur.total || 0), 0);
            const overallPresent = perCourse.reduce((acc, cur) => acc + (cur.title === courseTitle ? presentCount : cur.present || 0), 0);
            const overallPercent = overallTotal > 0 ? Number(((overallPresent / overallTotal) * 100).toFixed(1)) : 0;
            setSummary({ total: overallTotal, present: overallPresent, absent: overallTotal - overallPresent, percent: overallPercent });
          } catch (e) {
            console.error("Error refreshing per-course stats:", e);
          }
        }
      }
    } catch (err) {
      console.error("Refresh failed", err);
    }
  };

  // Render status badge with Missed detection
  const renderStatusBadge = (attRow, clDateStr) => {
    if (!attRow) {
      const today = new Date().toISOString().slice(0, 10);
      if (clDateStr < today) {
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100">Missed</Badge>;
      }
      return <Badge variant="outline">Not marked</Badge>;
    }
    if (attRow.status === "P") return <Badge className="bg-green-50 text-green-700 border-green-100">Present</Badge>;
    if (attRow.status === "A") return <Badge className="bg-red-50 text-red-700 border-red-100">Absent</Badge>;
    return <Badge variant="secondary">Marked</Badge>;
  };

  if (status === "loading" || loading) {
    return <p className="text-center mt-10 text-gray-500">Loading progress...</p>;
  }
  if (status !== "authenticated") {
    return <p className="text-center mt-10 text-gray-500">Please sign in to see your progress.</p>;
  }

  const { total, present, absent, percent } = summary;

  // Chart data - per course
  const chartData = perCourse.map((p) => ({ title: p.title, percent: Number(p.percent || 0) }));

  // color function for bars
  const barColor = (val) => {
    if (val >= 75) return "#10B981"; // green
    if (val >= 50) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Course Progress</h1>
        <p className="text-sm text-muted-foreground">Based on attendance records</p>
      </div>

      {/* Overview: Chart + Cards */}
      <div className="grid gap-6 md:grid-cols-3 items-start">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Per-course Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="title" type="category" width={160} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="percent" barSize={18} isAnimationActive>
                      {chartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={barColor(entry.percent)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                This chart shows each course's completion percentage (based on Present / Scheduled classes).
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary cards (reduced to two) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Summary</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">{percent}%</div>
                <div className="text-xs text-muted-foreground">Present: {present} / {total}</div>
              </div>
              <div className="mt-4">
                <Progress value={percent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Number of scheduled classes across your courses</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs + Detailed view */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={tab}>
            <TabsList>
              <TabsTrigger value="overview" onClick={() => setTab("overview")}>Overview</TabsTrigger>
              <TabsTrigger value="detailed" onClick={() => setTab("detailed")}>Detailed</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:space-x-8">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Present</p>
                      <div className="text-xl font-semibold">{present}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Absent</p>
                      <div className="text-xl font-semibold">{absent}</div>
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-muted-foreground">
                    This summary is calculated from your attendance records. Past classes that were not marked are shown as <strong>Missed</strong> in detailed view.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="mt-4">
              <div className="space-y-4">
                {perCourse.length === 0 ? (
                  <Card><CardContent><p className="text-sm text-muted-foreground">No course details available.</p></CardContent></Card>
                ) : (
                  perCourse.map((pc) => {
                    const details = courseDetails[pc.title];
                    return (
                      <Card key={pc.title}>
                        <CardHeader className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium">{pc.title}</CardTitle>
                            <div className="text-xs text-muted-foreground">Level: {pc.level}</div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold">{pc.percent}%</div>
                              <div className="text-xs text-muted-foreground">{pc.present}/{pc.total} present</div>
                            </div>

                            <div className="mt-2 w-40">
                              <Progress value={pc.percent} className="h-2" />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {pc.total > 0 ? `${pc.total} scheduled classes` : "No scheduled classes"}
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={() => handleViewClasses(pc.title, pc.level)}>
                                {expandedCourse === pc.title ? "Hide classes" : "View classes"}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded area -> timeline view */}
                          {expandedCourse === pc.title && (
                            <div className="mt-4 border-t pt-4 space-y-3">
                              {!details ? (
                                <div className="text-sm text-muted-foreground">Loading classes...</div>
                              ) : details.classes.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No scheduled classes for this course.</div>
                              ) : (
                                <div className="space-y-3">
                                  {details.classes.map((cl) => {
                                    const att = details.attendanceMap?.[cl.id];
                                    const today = new Date().toISOString().slice(0, 10);
                                    const isPast = cl.date < today;
                                    return (
                                      <div key={cl.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                                        <div className="flex-1">
                                          <div className="font-medium">{cl.date} • {cl.time}</div>
                                          <div className="text-xs text-muted-foreground">{cl.coach || "TBA"}</div>
                                          <div className="text-xs mt-2 text-muted-foreground">{cl.meet_link ? "Has Meet" : "No Meet"}</div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                          {/* status */}
                                          {renderStatusBadge(att, cl.date)}

                                          <div className="flex gap-2">
                                            {cl.meet_link ? (
                                              <Button size="sm" onClick={() => handleJoinAndRecord(cl)} disabled={joiningId === cl.id}>
                                                {joiningId === cl.id ? "Joining..." : "Join"}
                                              </Button>
                                            ) : (
                                              <Button size="sm" disabled>No Meet</Button>
                                            )}

                                            {(!att && isPast) && (
                                              <Button size="sm" variant="secondary" onClick={() => handleMarkAbsent(cl)} disabled={actionLoading}>
                                                Mark Absent
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column: Recent history */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent attendance records.</div>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between">
                      <div className="text-sm">
                        <div>{h.attendance_date}</div>
                        <div className="text-xs text-muted-foreground">Class ID: {h.class_list_id}</div>
                      </div>
                      <div>
                        {h.status === "P" ? <Badge className="bg-green-50 text-green-700">Present</Badge> : <Badge className="bg-red-50 text-red-700">Absent</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">Latest {history.length} records</div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
