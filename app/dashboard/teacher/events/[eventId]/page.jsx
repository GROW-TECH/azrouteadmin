'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Award,  
  Calendar,
  Download,
  Eye,
  Loader2,
  Mail,
  MoreVertical,
  Pencil,
  Trash,
  Users, 
  XCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { use } from 'react';

export default function TeacherEventPage({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const { eventId } =use(params)

  useEffect(() => {
    fetchEventData();
    fetchRegistrations();
  }, [eventId]); // Added eventId as dependency

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/teacher/events/${eventId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event data');
      }

      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/teacher/events/${eventId}/registrations`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const response = await fetch(`/api/teacher/events/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      toast({
        title: "Success",
        description: "Event status updated successfully"
      });

      fetchEventData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });

      router.push('/dashboard/teacher/events');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const downloadAttendeeList = async () => {
    try {
      const response = await fetch(`/api/teacher/events/${eventId}/registrations/export`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download attendee list');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title}-attendees.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <h1>Event not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/teacher/events')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">
              {format(new Date(event.startDate), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!statusLoading ? (
            <Select
              value={event.status}
              onValueChange={handleStatusChange}
              disabled={statusLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Button disabled variant="outline" className="w-[180px]">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/events/${event._id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Public Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/events/${event._id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteEvent} className="text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrations?.filter(r => r.status === 'confirmed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {event.maximumRegistrations} maximum
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${registrations
                  .filter(r => r.status === 'confirmed')
                  .reduce((sum, r) => sum + (r?.ticketTier?.price || 0), 0)
                  .toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                From paid registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Until Event</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(0, Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
              </div>
              <p className="text-xs text-muted-foreground">
                Starts {format(new Date(event.startDate), 'PP')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="registrations">
          <TabsList>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Registrations</h2>
              <Button onClick={downloadAttendeeList} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
  {registrations?.map((registration) => (
    <TableRow key={registration.id}>
      <TableCell className="font-medium">
        {registration.student?.name || 'Unknown'}
      </TableCell>
      <TableCell>{registration.ticketTier?.name || 'N/A'}</TableCell>
      <TableCell>${registration.ticketTier?.price || 0}</TableCell>
      <TableCell>
        <Badge
          variant={
            registration.status === 'confirmed'
              ? 'success'
              : registration.status === 'cancelled'
              ? 'destructive'
              : 'warning'
          }
          className="capitalize"
        >
          {registration.status || 'pending'}
        </Badge>
      </TableCell>
      <TableCell>
        {registration.registeredAt
          ? format(new Date(registration.registeredAt), 'PP')
          : 'N/A'}
      </TableCell>
      <TableCell>
        <Badge
          variant={
            registration.payment?.status === 'completed'
              ? 'success'
              : registration.payment?.status === 'failed'
              ? 'destructive'
              : 'secondary'
          }
          className="capitalize"
        >
          {registration.payment?.status || 'pending'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/teacher/events/${eventId}/registrations/${registration.id}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSendMessage(registration)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </DropdownMenuItem>
            {registration.status === 'pending' && (
              <DropdownMenuItem
                onClick={() => handleConfirmRegistration(registration.id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Registration
              </DropdownMenuItem>
            )}
            {registration.status === 'confirmed' && !registration.certificate?.issued && (
              <DropdownMenuItem
                onClick={() => handleIssueCertificate(registration.id)}
              >
                <Award className="h-4 w-4 mr-2" />
                Issue Certificate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {registration.status !== 'cancelled' && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleCancelRegistration(registration.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Registration
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed analytics and insights will be available here soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="destructive"
                  onClick={handleDeleteEvent}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}