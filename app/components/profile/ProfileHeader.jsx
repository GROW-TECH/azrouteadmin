"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Camera, Mail, MapPin, Link as LinkIcon } from "lucide-react";

export default function ProfileHeader({ user, isEditable }) {
  const router = useRouter();

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-48 w-full bg-gradient-to-r from-blue-600 to-indigo-600 relative">
        {isEditable && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4"
          >
            <Camera className="h-4 w-4 mr-2" />
            Change Cover
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="sm:flex sm:items-end sm:space-x-5 pb-4">
          <div className="relative -mt-16">
            <Avatar className="h-32 w-32 ring-4 ring-white">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            {isEditable && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="sm:hidden md:block min-w-0 flex-1">
              <h1 className="text-2xl font-bold truncate">{user.name}</h1>
              <p className="text-muted-foreground">{user.role}</p>
            </div>
            {isEditable ? (
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {/* Redirect to edit profile */}
                <Button onClick={() => router.push("/dashboard/teacher/profile/edit")}>
                  Edit Profile
                </Button>
                <Button variant="outline">View Public Profile</Button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button>Message</Button>
                <Button variant="outline">Follow</Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          {user.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {user.email}
            </div>
          )}
          {user.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {user.location}
            </div>
          )}
          {user.website && (
            <div className="flex items-center">
              <LinkIcon className="h-4 w-4 mr-2" />
              <a href={user.website} className="text-primary hover:underline">
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
