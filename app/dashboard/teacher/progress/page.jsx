"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function ProgressPage() {
  // demo data (replace with API fetch as needed)
  const [overall] = useState(75); // AI Course Assessment %
  const [rows] = useState([
    { student: "David Brown", course: "Advanced Tactics", completion: 80 },
    { student: "Sarah Wilson", course: "Endgame Strategies", completion: 65 },
    { student: "James Lee", course: "Introduction to Openings", completion: 90 },
    { student: "Emily Davis", course: "Chess for Beginners", completion: 50 },
  ]);

  // simple client-side filters (optional)
  const [q, setQ] = useState("");
  const [min, setMin] = useState("0");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (r.student.toLowerCase().includes(q.toLowerCase()) ||
            r.course.toLowerCase().includes(q.toLowerCase())) &&
          r.completion >= Number(min)
      ),
    [rows, q, min]
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Progress</h1>

      {/* Progress Tracker */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Progress Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg md:text-xl font-semibold">AI Course Assessment</span>
              <span className="text-lg font-semibold">{overall}%</span>
            </div>
            <Progress value={overall} className="h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search student or course"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:w-80"
            />
            <Select value={min} onValueChange={setMin}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Min completion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All completion</SelectItem>
                <SelectItem value="50">≥ 50%</SelectItem>
                <SelectItem value="75">≥ 75%</SelectItem>
                <SelectItem value="90">≥ 90%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Student</TableHead>
                  <TableHead className="w-[40%]">Course</TableHead>
                  <TableHead className="text-right w-[20%]">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={i} className="align-middle">
                    <TableCell className="font-medium">{r.student}</TableCell>
                    <TableCell>{r.course}</TableCell>
                    <TableCell className="text-right">{r.completion}%</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No records match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
