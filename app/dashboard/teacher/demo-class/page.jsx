"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Users } from "lucide-react";

export default function DemoClassListPage() {
  const [demoClasses, setDemoClasses] = useState([]);

  useEffect(() => {
    // Temporary mock data - Replace with API call
    setDemoClasses([
      {
        id: "1",
        title: "Beginner Chess Demo",
        date: "2025-08-10",
        time: "5:00 PM",
        participants: 12,
        meetLink: "https://meet.google.com/xyz-abc-pqr",
      },
      {
        id: "2",
        title: "Advanced Opening Strategies",
        date: "2025-08-12",
        time: "7:00 PM",
        participants: 8,
        meetLink: "https://meet.google.com/aaa-bbb-ccc",
      },
    ]);
  }, []);

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Demo Classes</h1>
          <p className="text-muted-foreground">
            Manage and start your demo classes
          </p>
        </div>
        <Button
          onClick={() => alert("Redirect to create new demo class form")}
        >
          + Create Demo Class
        </Button>
      </div>

      {/* List of Demo Classes */}
      <div className="grid gap-6 md:grid-cols-2">
        {demoClasses.map((demo) => (
          <Card key={demo.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{demo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{demo.date}</span>
                <span>•</span>
                <span>{demo.time}</span>
              </div>

              {/* Participants */}
              <div className="flex items-center text-sm text-muted-foreground space-x-2">
                <Users className="h-4 w-4" />
                <span>{demo.participants} participants</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-3">
                <Button
                  className="flex items-center space-x-2"
                  onClick={() => window.open(demo.meetLink, "_blank")}
                >
                  <Video className="h-4 w-4" />
                  <span>Start Class</span>
                </Button>
                <Button variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {demoClasses.length === 0 && (
          <p className="text-center text-muted-foreground col-span-2">
            No demo classes found. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
