// app/dashboard/teacher/events/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Calendar,
  Search,
  Plus,
  Filter,
  Users,
  Clock,
  MapPin,
  Video,
  MoreVertical,
  Edit2,
  Trash2,
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeacherEvents() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const searchParams = new URLSearchParams({
        ...filters,
        page: 1,
        limit: 10
      });

      const response = await fetch(`/api/teacher/events?${searchParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
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

      fetchEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyEventLink = (eventId) => {
    const link = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Success",
      description: "Event link copied to clipboard"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            Manage your workshops, conferences, and other events
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/teacher/events/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="bootcamp">Bootcamp</SelectItem>
                <SelectItem value="masterclass">Masterclass</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid gap-6">
        {events.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No events found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first event
              </p>
              <Button onClick={() => router.push('/dashboard/teacher/events/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4">
                    <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={event.thumbnail}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={
                          event.status === 'published' ? 'success' :
                          event.status === 'draft' ? 'secondary' :
                          event.status === 'cancelled' ? 'destructive' :
                          'default'
                        }>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          {event.location.type === 'online' ? (
                            <Video className="h-4 w-4 mr-2" />
                          ) : (
                            <MapPin className="h-4 w-4 mr-2" />
                          )}
                          {event.location.type === 'online' ? 'Online Event' : event.location.venue}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          {event.currentRegistrations}/{event.maximumRegistrations} registered
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/teacher/events/${event._id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/teacher/events/${event._id}/edit`)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyEventLink(event._id)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        {event.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(event._id, 'published')}
                          >
                            Publish
                          </DropdownMenuItem>
                        )}
                        {event.status === 'published' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(event._id, 'cancelled')}
                            className="text-red-600"
                          >
                            Cancel Event
                          </DropdownMenuItem>
                        )}
                        {event.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(event._id, 'deleted')}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Progress Bar for Registration */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Registration Progress</span>
                    <span>{Math.round((event.currentRegistrations / event.maximumRegistrations) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ 
                        width: `${(event.currentRegistrations / event.maximumRegistrations) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}