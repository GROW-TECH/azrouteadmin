// app/dashboard/teacher/events/create/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash, 
  Upload,
  Users,
  Video
} from "lucide-react";
import { uploadToFirebase } from '@/lib/firebase';
import { use } from 'react';

const EVENT_TYPES = [
  'workshop',
  'conference',
  'webinar',
  'bootcamp',
  'masterclass',
  'other'
];

export const CATEGORIES = [
  // 'Web Development',
  // 'Mobile Development',
  // 'Data Science',
  // 'Machine Learning',
  // 'DevOps',
  // 'Cloud Computing',
  // 'Cybersecurity',
  // 'Blockchain',
  // 'Game Development',
  'Dentistry',
  'Medical',
  'Nursing',
  'Other'
];

export default function EventForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [eventData, setEventData] = useState({
    title: '',
    type: '',
    description: '',
    category: '',
    thumbnail: null,
    startDate: '',
    endDate: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: {
      type: 'online',
      venue: '',
      address: '',
      city: '',
      country: '',
      meetingLink: '',
      meetingPlatform: 'zoom'
    },
    capacity: 100,
    ticketTiers: [{
      name: 'General Admission',
      price: 0,
      maxAttendees: 100,
      benefits: ['Access to all sessions'],
      availableCount: 100
    }],
    prerequisites: [],
    agenda: [{
      time: '',
      title: '',
      description: ''
    }],
    speakers: [{
      name: '',
      bio: '',
      avatar: '',
      designation: '',
      company: ''
    }],
    registrationDeadline: '',
    maximumRegistrations: 100,
    isRefundable: false,
    refundPolicy: '',
    certificateProvided: false,
    featured: false
  });


  const handleChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      const thumbnailURL = await uploadToFirebase(
        file,
        'event-thumbnails'
      );
      handleChange('thumbnail', thumbnailURL);
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Error",
        description: "Failed to upload thumbnail",
        variant: "destructive"
      });
    }
  };

  const addTicketTier = () => {
    setEventData(prev => ({
      ...prev,
      ticketTiers: [
        ...prev.ticketTiers,
        {
          name: '',
          price: 0,
          maxAttendees: 50,
          benefits: [],
          availableCount: 50
        }
      ]
    }));
  };

  const removeTicketTier = (index) => {
    if (eventData.ticketTiers.length === 1) {
      toast({
        title: "Error",
        description: "Event must have at least one ticket tier",
        variant: "destructive"
      });
      return;
    }

    setEventData(prev => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((_, i) => i !== index)
    }));
  };

  const updateTicketTier = (index, field, value) => {
    setEventData(prev => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const addAgendaItem = () => {
    setEventData(prev => ({
      ...prev,
      agenda: [
        ...prev.agenda,
        {
          time: '',
          title: '',
          description: ''
        }
      ]
    }));
  };

  const removeAgendaItem = (index) => {
    setEventData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const updateAgendaItem = (index, field, value) => {
    setEventData(prev => ({
      ...prev,
      agenda: prev.agenda.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addSpeaker = () => {
    setEventData(prev => ({
      ...prev,
      speakers: [
        ...prev.speakers,
        {
          name: '',
          bio: '',
          avatar: '',
          designation: '',
          company: ''
        }
      ]
    }));
  };

  const removeSpeaker = (index) => {
    setEventData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };

  const updateSpeaker = (index, field, value) => {
    setEventData(prev => ({
      ...prev,
      speakers: prev.speakers.map((speaker, i) => 
        i === index ? { ...speaker, [field]: value } : speaker
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.thumbnail) {
        throw new Error('Please fill in all required fields');
      }

      // Validate dates
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      const registrationDeadline = new Date(eventData.registrationDeadline);

      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }

      if (registrationDeadline > startDate) {
        throw new Error('Registration deadline must be before event start date');
      }

      const response = await fetch('/api/teacher/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      toast({
        title: "Success",
        description: "Event created successfully"
      });

      router.push('/dashboard/teacher/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-8 max-w-5xl mx-auto">
    <div className="flex items-center space-x-4 mb-6">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/dashboard/teacher/events')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new event
        </p>
      </div>
    </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={eventData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={eventData.type}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea
                id="description"
                value={eventData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={eventData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Event Thumbnail</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  required={!eventData.thumbnail}
                />
                {eventData.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={eventData.thumbnail}
                      alt="Event thumbnail"
                      className="h-20 w-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date and Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date and Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={eventData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={eventData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={eventData.registrationDeadline}
                  onChange={(e) => handleChange('registrationDeadline', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select
                  value={eventData.timeZone}
                  onValueChange={(value) => handleChange('timeZone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {Intl.supportedValuesOf('timeZone').map(zone => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Location Type</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={eventData.location.type === 'online' ? 'default' : 'outline'}
                  onClick={() => handleLocationChange('type', 'online')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Online
                </Button>
                <Button
                  type="button"
                  variant={eventData.location.type === 'physical' ? 'default' : 'outline'}
                  onClick={() => handleLocationChange('type', 'physical')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Physical
                </Button>
                <Button
                  type="button"
                  variant={eventData.location.type === 'hybrid' ? 'default' : 'outline'}
                  onClick={() => handleLocationChange('type', 'hybrid')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Hybrid
                </Button>
              </div>
            </div>

            {(eventData.location.type === 'online' || eventData.location.type === 'hybrid') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingPlatform">Platform</Label>
                    <Select
                      value={eventData.location.meetingPlatform}
                      onValueChange={(value) => handleLocationChange('meetingPlatform', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      value={eventData.location.meetingLink}
                      onChange={(e) => handleLocationChange('meetingLink', e.target.value)}
                      placeholder="Enter meeting URL"
                    />
                  </div>
                </div>
              </div>
            )}

            {(eventData.location.type === 'physical' || eventData.location.type === 'hybrid') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue Name</Label>
                  <Input
                    id="venue"
                    value={eventData.location.venue}
                    onChange={(e) => handleLocationChange('venue', e.target.value)}
                    placeholder="Enter venue name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={eventData.location.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    placeholder="Enter venue address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={eventData.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={eventData.location.country}
                      onChange={(e) => handleLocationChange('country', e.target.value)}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets and Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets and Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maximumRegistrations">Maximum Registrations</Label>
                <Input
                  id="maximumRegistrations"
                  type="number"
                  min="1"
                  value={eventData.maximumRegistrations}
                  onChange={(e) => handleChange('maximumRegistrations', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Refund Policy</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={eventData.isRefundable}
                    onCheckedChange={(checked) => handleChange('isRefundable', checked)}
                  />
                  <span>Allow refunds</span>
                </div>
                {eventData.isRefundable && (
                  <Textarea
                    value={eventData.refundPolicy}
                    onChange={(e) => handleChange('refundPolicy', e.target.value)}
                    placeholder="Enter refund policy details"
                  />
                )}
              </div>
            </div>

            {/* Ticket Tiers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Ticket Tiers</Label>
                <Button type="button" variant="outline" onClick={addTicketTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>
              {eventData.ticketTiers.map((tier, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-medium">Ticket Tier {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketTier(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tier Name</Label>
                        <Input
                          value={tier.name}
                          onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                          placeholder="e.g., Early Bird, VIP"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          min="0"
                          value={tier.price}
                          onChange={(e) => updateTicketTier(index, 'price', parseFloat(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Attendees</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.maxAttendees}
                          onChange={(e) => updateTicketTier(index, 'maxAttendees', parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Available Tickets</Label>
                        <Input
                          type="number"
                          min="0"
                          max={tier.maxAttendees}
                          value={tier.availableCount}
                          onChange={(e) => updateTicketTier(index, 'availableCount', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label>Benefits</Label>
                      <Textarea
                        value={tier.benefits.join('\n')}
                        onChange={(e) => updateTicketTier(index, 'benefits', e.target.value.split('\n'))}
                        placeholder="Enter benefits (one per line)"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prerequisites */}
            <div className="space-y-2">
              <Label>Prerequisites</Label>
              <Textarea
                value={eventData.prerequisites.join('\n')}
                onChange={(e) => handleChange('prerequisites', e.target.value.split('\n'))}
                placeholder="Enter prerequisites (one per line)"
                rows={3}
              />
            </div>

            {/* Agenda */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Event Agenda</Label>
                <Button type="button" variant="outline" onClick={addAgendaItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agenda Item
                </Button>
              </div>
              {eventData.agenda.map((item, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Agenda Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAgendaItem(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={item.time}
                        onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                        placeholder="Session title"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                      placeholder="Session description"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Speakers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Event Speakers</Label>
                <Button type="button" variant="outline" onClick={addSpeaker}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Speaker
                </Button>
              </div>
              {eventData.speakers.map((speaker, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Speaker {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpeaker(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                        placeholder="Speaker name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input
                        value={speaker.designation}
                        onChange={(e) => updateSpeaker(index, 'designation', e.target.value)}
                        placeholder="Speaker designation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={speaker.company}
                        onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Avatar</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            // Handle speaker avatar upload
                            uploadToFirebase(e.target.files[0], 'speaker-avatars')
                              .then(url => updateSpeaker(index, 'avatar', url))
                              .catch(error => {
                                console.error('Error uploading avatar:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to upload avatar",
                                  variant: "destructive"
                                });
                              });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Bio</Label>
                    <Textarea
                      value={speaker.bio}
                      onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                      placeholder="Speaker bio"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Other Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={eventData.certificateProvided}
                  onCheckedChange={(checked) => handleChange('certificateProvided', checked)}
                />
                <Label>Provide Completion Certificate</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={eventData.featured}
                  onCheckedChange={(checked) => handleChange('featured', checked)}
                />
                <Label>Feature this Event</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/teacher/events')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
        type="submit"
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating...
          </>
        ) : (
          'Create Event'
        )}
      </Button>
        </div>

        {/* Warning Alert */}
        <Alert>
          <AlertDescription>
            Please review all details carefully before creating the event. 
            Make sure all required fields are filled and dates are correct.
          </AlertDescription>
        </Alert>
      </form>
    </div>
  );
}

