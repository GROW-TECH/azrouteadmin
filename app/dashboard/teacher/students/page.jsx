"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Plus, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/teacher/students", { credentials: "include" });
        if (!res.ok) throw new Error("fallback");
        const data = await res.json();
        if (active) setStudents(data.students || []);
      } catch {
        // Fallback demo data
        if (!active) return;
        setStudents([
          { id: "S001", name: "Alice Johnson", email: "alice@school.com", course: "Beginner", joined: "2025-03-02", status: "active" },
          { id: "S002", name: "Bob Carter", email: "bob@school.com", course: "Intermediate", joined: "2025-02-12", status: "inactive" },
          { id: "S003", name: "Charlie Kim", email: "charlie@school.com", course: "Beginner", joined: "2025-01-22", status: "active" },
          { id: "S004", name: "Divya Rao", email: "divya@school.com", course: "Advanced", joined: "2025-04-10", status: "active" },
          { id: "S005", name: "Ethan Li", email: "ethan@school.com", course: "Intermediate", joined: "2025-05-03", status: "pending" },
        ]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase());
      const matchesCourse = courseFilter === "all" || s.course === courseFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesCourse && matchesStatus;
    });
  }, [students, query, courseFilter, statusFilter]);

  const exportCSV = () => {
    const header = ["ID", "Name", "Email", "Course", "Joined", "Status"];
    const rows = filtered.map((s) => [s.id, s.name, s.email, s.course, s.joined, s.status]);
    const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Students</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Manage enrolled students, filter by course or status, and export.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportCSV} variant="outline" className="whitespace-nowrap">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button onClick={() => alert("Create student flow here")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{s.id}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-gray-600">{s.email}</TableCell>
                        <TableCell>{s.course}</TableCell>
                        <TableCell>{new Date(s.joined).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              s.status === "active" ? "default" : s.status === "pending" ? "secondary" : "outline"
                            }
                          >
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => alert(`Open details/edit for ${s.name}`)}
                            className="h-8 px-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
