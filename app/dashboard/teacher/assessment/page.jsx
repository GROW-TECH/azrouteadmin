"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, Download, Plus, MoreHorizontal } from "lucide-react";

export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("all");
  const [status, setStatus] = useState("all");

  // create dialog state
  const [open, setOpen] = useState(false);
  const [newA, setNewA] = useState({ title: "", course: "", date: "", total: 100 });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/teacher/assessments", { credentials: "include" });
        if (!res.ok) throw new Error("fallback");
        const data = await res.json();
        if (active) setAssessments(data.assessments || []);
      } catch {
        if (!active) return;
        setAssessments([
          { id: "A-101", title: "Midterm - Openings", course: "Beginner", date: "2025-05-15", total: 100, status: "published" },
          { id: "A-102", title: "Tactics Quiz 1", course: "Advanced", date: "2025-06-01", total: 50, status: "draft" },
          { id: "A-103", title: "Endgame Practical", course: "Intermediate", date: "2025-06-25", total: 75, status: "published" },
          { id: "A-104", title: "Final Assessment", course: "Beginner", date: "2025-07-10", total: 100, status: "scheduled" },
        ]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const qMatch =
        !q ||
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.id.toLowerCase().includes(q.toLowerCase());
      const cMatch = course === "all" || a.course === course;
      const sMatch = status === "all" || a.status === status;
      return qMatch && cMatch && sMatch;
    });
  }, [assessments, q, course, status]);

  const exportCSV = () => {
    const header = ["ID", "Title", "Course", "Date", "Total", "Status"];
    const rows = filtered.map(a => [a.id, a.title, a.course, a.date, a.total, a.status]);
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "assessments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const createAssessment = () => {
    const id = `A-${Math.floor(Math.random()*900+100)}`;
    const newRow = { id, title: newA.title, course: newA.course || "Beginner", date: newA.date, total: Number(newA.total||100), status: "draft" };
    setAssessments(prev => [newRow, ...prev]);
    setOpen(false);
    setNewA({ title: "", course: "", date: "", total: 100 });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Assessments</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Create, filter, and manage all assessments.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Input
              placeholder="Search by title or ID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:w-72"
            />

            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Create Assessment</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>New Assessment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Title</label>
                    <Input value={newA.title} onChange={(e)=>setNewA({...newA, title:e.target.value})} placeholder="e.g., Tactics Quiz 2" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Course</label>
                    <Select value={newA.course} onValueChange={(v)=>setNewA({...newA, course:v})}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input type="date" className="pl-8" value={newA.date} onChange={(e)=>setNewA({...newA, date:e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Total Marks</label>
                    <Input type="number" value={newA.total} onChange={(e)=>setNewA({...newA, total:e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                  <Button onClick={createAssessment}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No assessments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{a.id}</TableCell>
                      <TableCell>{a.title}</TableCell>
                      <TableCell>{a.course}</TableCell>
                      <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                      <TableCell>{a.total}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "published" ? "default" :
                            a.status === "scheduled" ? "secondary" : "outline"
                          }
                        >
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" className="h-8 px-2" onClick={()=>alert(`Open ${a.id}`)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
