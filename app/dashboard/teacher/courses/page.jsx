"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  BarChart2,
  Globe,
  Clock,
  Book,
  FileText,
  Settings,
} from "lucide-react";

// --- Mock fallback data ---
const mockCourses = [
  {
    _id: "1",
    title: "Beginner Chess Fundamentals",
    description: "Learn the basics of chess, including piece movement and opening principles.",
    category: "Chess",
    level: "Beginner",
    thumbnail: "https://via.placeholder.com/400x225?text=Beginner+Chess",
    price: 49.99,
    enrolledStudents: 120,
    totalDuration: 180,
    rating: 4.8,
    status: "published",
     students: [
      {
        _id: "s1",
        name: "John Doe",
        email: "john@example.com",
        enrolledAt: "2025-07-01",
        progress: 75,
        lastActive: "2025-08-01"
      },
      {
        _id: "s2",
        name: "Jane Smith",
        email: "jane@example.com",
        enrolledAt: "2025-07-05",
        progress: 40,
        lastActive: "2025-08-02"
      }
    ]
  },
  {
    _id: "2",
    title: "Intermediate Chess Tactics",
    description: "Sharpen your skills with tactics like forks, pins, and skewers.",
    category: "Chess",
    level: "Intermediate",
    thumbnail: "https://via.placeholder.com/400x225?text=Intermediate+Tactics",
    price: 79.99,
    enrolledStudents: 85,
    totalDuration: 240,
    rating: 4.6,
    status: "draft",
  },
  {
    _id: "3",
    title: "Mastering Endgames",
    description: "Learn to convert your advantage in the endgame and dominate with precision.",
    category: "Chess",
    level: "Advanced",
    thumbnail: "https://via.placeholder.com/400x225?text=Endgames",
    price: 99.99,
    enrolledStudents: 45,
    totalDuration: 200,
    rating: 4.9,
    status: "published",
  }
];

function CourseCard({ course, onDelete, onStatusChange }) {
  const { toast } = useToast();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/teacher/courses/${course._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete course");
      onDelete(course._id);
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const response = await fetch("/api/teacher/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId: course._id, status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update course status");

      toast({
        title: "Success",
        description: `Course ${newStatus === "published" ? "published" : "unpublished"} successfully`,
      });
      onStatusChange(course._id, newStatus);
    } catch (error) {
      console.error("Error updating course status:", error);
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex space-x-4">
            <img
              src={course.thumbnail || "/placeholder-course.jpg"}
              alt={course.title}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{course.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{course.enrolledStudents} students</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{Math.ceil(course.totalDuration / 60)} hrs</span>
                </div>
                <Badge
                  variant={
                    course.status === "published"
                      ? "success"
                      : course.status === "draft"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {course.status}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/courses/${course._id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/courses/${course._id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(course.status === "published" ? "draft" : "published")}
                disabled={statusUpdating}
              >
                {course.status === "published" ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" /> Unpublish
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" /> Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Course</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this course? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Deleting..." : "Delete Course"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherCourses() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, statusFilter, sortOrder]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        sort: sortOrder,
      });
      const response = await fetch(`/api/teacher/courses?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      if (data?.courses?.length > 0) {
        setCourses(data.courses);
      } else {
        setCourses(mockCourses); // fallback when API returns empty
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses(mockCourses); // fallback on error
      toast({
        title: "Error",
        description: "Failed to fetch courses, showing sample data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (courseId) => {
    setCourses((prev) => prev.filter((course) => course._id !== courseId));
    toast({
      title: "Success",
      description: "Course deleted successfully",
    });
  };

  const handleStatusChange = (courseId, newStatus) => {
    setCourses((prev) =>
      prev.map((course) =>
        course._id === courseId ? { ...course, status: newStatus } : course
      )
    );
    toast({
      title: "Success",
      description: `Course ${newStatus === "published" ? "published" : "unpublished"} successfully`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage and monitor your courses</p>
        </div>
        <Button onClick={() => router.push("/dashboard/teacher/courses/create")}>
          <Plus className="h-4 w-4 mr-2" /> Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="students">Most Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {loading ? (
          Array(3)
            .fill(null)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex space-x-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Book className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Courses Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first course
              </p>
              <Button onClick={() => router.push("/dashboard/teacher/courses/create")}>
                <Plus className="h-4 w-4 mr-2" /> Create Course
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
