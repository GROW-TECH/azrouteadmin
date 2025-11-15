"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Clock,
  Video,
  Users,
  Link as LinkIcon,
  Plus,
  Settings,
  ExternalLink,
  Info,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function TeacherLivestreamsPage() {
  const router = useRouter();
  const { user, loading } = useAuth("teacher");
  const { toast } = useToast();

  // State management
  const [streams, setStreams] = useState({ live: [], scheduled: [], ended: [] });
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [showNewStreamDialog, setShowNewStreamDialog] = useState(false);
  const [streamType, setStreamType] = useState("native");
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // New stream form state with improved default values
  const [newStream, setNewStream] = useState({
    title: "",
    description: "",
    courseId: "",
    type: "native",
    scheduledFor: null,
    platform: "",
    meetingUrl: "",
    passcode: "",
    settings: {
      isChatEnabled: true,
      isQuestionsEnabled: true,
      isRecordingEnabled: true,
      allowReplays: true,
      waitingRoom: false,
      requireRegistration: false,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!loading && user?.role === "teacher") {
        try {
          const [coursesResponse, liveStreams, scheduledStreams, endedStreams] = await Promise.all([
            fetch("/api/teacher/courses").then(res => res.json()),
            fetch("/api/livestreams?status=live").then(res => res.json()),
            fetch("/api/livestreams?status=scheduled").then(res => res.json()),
            fetch("/api/livestreams?status=ended").then(res => res.json())
          ]);

          setCourses(coursesResponse.courses);
          setStreams({
            live: liveStreams.streams,
            scheduled: scheduledStreams.streams,
            ended: endedStreams.streams,
          });
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({
            title: "Error",
            description: "Failed to load livestreams",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user?.role, loading]);

  const handleCreateStream = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/livestreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStream),
      });

      if (!response.ok) throw new Error("Failed to create livestream");

      const data = await response.json();
      setShowNewStreamDialog(false);
      toast({
        title: "Success",
        description: "Livestream created successfully",
      });

      if (newStream.type === "native" && !newStream.scheduledFor) {
        router.push(`/dashboard/teacher/livestreams/${data.livestream.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create livestream",
        variant: "destructive",
      });
    }
  };

  const copyJoinLink = async (streamId) => {
    const link = `${window.location.origin}/livestream/${streamId}`;
    await navigator.clipboard.writeText(link);
    toast({
      title: "Success",
      description: "Join link copied to clipboard",
    });
  };

  const startScheduledStream = async (streamId) => {
    try {
      const response = await fetch(`/api/livestreams/${streamId}/start`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to start stream");
      router.push(`/dashboard/teacher/livestreams/${streamId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start stream",
        variant: "destructive",
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const renderStreamCard = (stream, type) => (
    <Card key={stream._id} className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1 text-lg font-semibold">
            {stream.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyJoinLink(stream._id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
        {stream.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {stream.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {type === "live" ? (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-emerald-600">
                <Users className="w-4 h-4 mr-1" />
                {stream.statistics.currentViewers} viewers
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.round((Date.now() - new Date(stream.startedAt)) / 1000 / 60)}m
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(stream.scheduledFor).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(stream.scheduledFor).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}
          
          {stream.type !== 'native' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4 mr-1" />
              Via {stream.type}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full mr-2"
              onClick={() => type === "live" 
                ? router.push(`/dashboard/teacher/livestreams/${stream._id}/settings`)
                : copyJoinLink(stream._id)
              }
            >
              {type === "live" ? (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="w-full"
              onClick={() => type === "live"
                ? router.push(`/dashboard/teacher/livestreams/${stream._id}`)
                : startScheduledStream(stream._id)
              }
            >
              {type === "live" ? "Join Stream" : "Start Stream"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDialogContent = () => {
    const steps = [
      {
        title: "Basic Details",
        fields: (
          <div className="space-y-4">
            <div>
              <Label>Stream Type</Label>
              <Select 
                value={streamType} 
                onValueChange={(value) => {
                  setStreamType(value);
                  setNewStream(prev => ({ ...prev, type: value }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">Native Streaming</SelectItem>
                  <SelectItem value="zoom">Zoom Meeting</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title</Label>
              <Input
                required
                value={newStream.title}
                onChange={(e) =>
                  setNewStream((prev) => ({ ...prev, title: e.target.value }))
                }
                className="mt-1"
                placeholder="Enter your live class title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newStream.description}
                onChange={(e) =>
                  setNewStream((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mt-1"
                placeholder="Provide a brief description of your live class"
                rows={3}
              />
            </div>
          </div>
        )
      },
      {
        title: "Schedule & Course",
        fields: (
          <div className="space-y-6">
            {/* <div>
              <Label className="mb-2 block">Schedule (Optional)</Label>
              <CalendarComponent
                mode="single"
                selected={newStream.scheduledFor}
                onSelect={(date) =>
                  setNewStream((prev) => ({ ...prev, scheduledFor: date }))
                }
                className="rounded-md border"
              />
            </div> */}

            <div>
              <Label>Course (Optional)</Label>
              <Select
                value={newStream.courseId}
                onValueChange={(value) =>
                  setNewStream((prev) => ({ ...prev, courseId: value }))
                }
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {streamType !== 'native' && (
              <div>
                <Label>Meeting URL</Label>
                <Input
                  required
                  value={newStream.meetingUrl}
                  onChange={(e) =>
                    setNewStream((prev) => ({ ...prev, meetingUrl: e.target.value }))
                  }
                  className="mt-1"
                  placeholder={`Enter your ${streamType} meeting URL`}
                />
              </div>
            )}
          </div>
        )
      },
      {
        title: "Stream Settings",
        fields: streamType === 'native' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Chat</Label>
                <p className="text-sm text-muted-foreground">
                  Allow participants to chat during the stream
                </p>
              </div>
              <Switch
                checked={newStream.settings.isChatEnabled}
                onCheckedChange={(checked) =>
                  setNewStream((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, isChatEnabled: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Questions</Label>
                <p className="text-sm text-muted-foreground">
                  Enable Q&A functionality during the stream
                </p>
              </div>
              <Switch
                checked={newStream.settings.isQuestionsEnabled}
                onCheckedChange={(checked) =>
                  setNewStream((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, isQuestionsEnabled: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Record Stream</Label>
                <p className="text-sm text-muted-foreground">
                  Save the stream for later viewing
                </p>
              </div>
              <Switch
                checked={newStream.settings.isRecordingEnabled}
                onCheckedChange={(checked) =>
                  setNewStream((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, isRecordingEnabled: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Waiting Room</Label>
                <p className="text-sm text-muted-foreground">
                  Hold participants in a waiting room
                </p>
              </div>
              <Switch
                checked={newStream.settings.waitingRoom}
                onCheckedChange={(checked) =>
                  setNewStream((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, waitingRoom: checked }
                  }))
                }
              />
            </div>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-6">
        <div className="relative">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep > index
                        ? "bg-primary text-primary-foreground"
                        : currentStep === index + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 w-full ${
                        currentStep > index + 1 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <span
                  key={index}
                  className={`text-sm ${
                    currentStep === index + 1
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {steps[currentStep - 1].fields}
        </div>

        {/* Navigation Buttons */}
        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewStreamDialog(false)}
            >
              Cancel
            </Button>
            {currentStep === steps.length ? (
              <Button type="submit" onClick={handleCreateStream}>
                {newStream.scheduledFor ? "Schedule Stream" : "Start Stream"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Live Classes</h1>
        <Button 
          onClick={() => setShowNewStreamDialog(true)}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Live Class
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="live" className="flex items-center">
            <Video className="w-4 h-4 mr-2" />
            Live Now ({streams.live.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled ({streams.scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="ended" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Past Classes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {streams.live.map((stream) => renderStreamCard(stream, "live"))}
            {streams.live.length === 0 && (
              <div className="col-span-full">
                <Card className="bg-muted/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Video className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active livestreams</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowNewStreamDialog(true)}
                    >
                      Start a new stream
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {streams.scheduled.map((stream) => renderStreamCard(stream, "scheduled"))}
            {streams.scheduled.length === 0 && (
              <div className="col-span-full">
                <Card className="bg-muted/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No scheduled livestreams</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowNewStreamDialog(true)}
                    >
                      Schedule a stream
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ended">
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Info className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Past classes feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewStreamDialog} onOpenChange={setShowNewStreamDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Live Class</DialogTitle>
            <DialogDescription>
              Set up a new live class session or schedule one for later
            </DialogDescription>
          </DialogHeader>

            {renderDialogContent()}
          
        </DialogContent>
      </Dialog>
    </div>
  );
}
