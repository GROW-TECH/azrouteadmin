"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    website: "",
    bio: "",
    avatar: "",
  });

  useEffect(() => {
    // Temporary mock data - replace with API call
    setFormData({
      name: "John Doe",
      email: "john@example.com",
      location: "New York, USA",
      website: "https://example.com",
      bio: "Chess coach and enthusiast",
      avatar: "https://via.placeholder.com/150",
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Replace with API call to update user profile
    console.log("Saving profile:", formData);

    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });

    router.push("/dashboard/teacher/profile");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar} alt={formData.name} />
              <AvatarFallback>{formData.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar">Profile Picture URL</Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => handleChange("avatar", e.target.value)}
                placeholder="Enter image URL"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.push("/dashboard/teacher/profile")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
