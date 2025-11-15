"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Book,
  Clock,
  Medal,
  Target,
  ChevronRight,
  PlayCircle,
  Puzzle,
  Trophy,
  Loader2,
} from "lucide-react";

function OverviewCard({ icon: Icon, title, value, subtitle }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{value ?? 0}</div>
          <p className="text-xs text-muted-foreground">{subtitle ?? ''}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [activeCourses, setActiveCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, coursesRes, certsRes, goalsRes] = await Promise.all([
        fetch("/api/student/stats"),
        fetch("/api/student/courses/active"),
        fetch("/api/student/certificates"),
        fetch("/api/student/goals"),
      ]);

      const [statsData, coursesData, certData, goalData] = await Promise.all([
        statsRes.json(),
        coursesRes.json(),
        certsRes.json(),
        goalsRes.json(),
      ]);

      setStats(statsData ?? {});
      setActiveCourses(coursesData?.courses ?? coursesData ?? []);
      setCertificates(certData?.certificates ?? certData ?? []);
      setGoals(goalData?.goals ?? goalData ?? []);
    } catch (err) {
      console.error("Dashboard fetch error", err);
      setStats({});
      setActiveCourses([]);
      setCertificates([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (id) => {
    router.push(`/learn/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome Back to Azroute Chess Institute</h1>
          <p className="text-muted-foreground">Track and improve your chess learning journey.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/student/courses")}>
          Browse Courses <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-10">
        <OverviewCard icon={Book} title="Courses Enrolled" value={stats.totalCourses} subtitle={`${stats.activeCourses ?? 0} active`} />
        <OverviewCard icon={Clock} title="Hours Spent" value="50 hrs" subtitle="Past 30 days" />
        <OverviewCard icon={Medal} title="Certificates" value={stats.completedCourses} subtitle="Courses completed" />
        <OverviewCard icon={Target} title="Progress" value="40%" subtitle="Average" />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="puzzles">Chess Puzzles</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeCourses.map((course) => (
                <Card key={course.id}>
                  <div className="relative aspect-video">
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt={course.title} />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                      <Button onClick={() => handleCourseClick(course.id)}>
                        <PlayCircle className="h-4 w-4 mr-2" /> Continue
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      {course.teacher?.firstName} {course.teacher?.lastName}
                    </div>
                    <Progress value={course.progress ?? 0} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No active courses yet.</p>
          )}
        </TabsContent>

        <TabsContent value="certificates">
          {(certificates.length > 0) ? (
            <div className="grid gap-4 md:grid-cols-2">
              {certificates.map(cert => (
                <Card key={cert.id}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-1">{cert.courseTitle}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Completed on {new Date(cert.completedAt).toLocaleDateString()}
                    </p>
                    <Button variant="outline" onClick={() => window.open(cert.url, '_blank')}>View Certificate</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No certificates yet.</p>
          )}
        </TabsContent>

        <TabsContent value="goals">
          {(goals.length > 0) ? (
            <div className="space-y-4">
              {goals.map(goal => (
                <Card key={goal.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">Due {new Date(goal.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Progress value={goal.progress ?? 0} className="w-24 h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No goals set yet.</p>
          )}
        </TabsContent>

        <TabsContent value="puzzles">
          <div className="text-center py-8">
            <Puzzle className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">Chess Puzzles coming soon!</p>
            <p className="text-muted-foreground">Improve tactics by solving daily puzzles.</p>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="text-center py-8">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">Leaderboard feature coming soon!</p>
            <p className="text-muted-foreground">Compete with your peers and climb the rankings.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentDashboard;
