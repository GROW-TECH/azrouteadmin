import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabaseClient';


export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken || !authToken.value) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
      await connectDB();

      let user;
      if (decoded.role === 'teacher') {
        user = await Teacher.findById(decoded.userId)
          .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
          .lean();
      } else if (decoded.role === 'student') {
        user = await Student.findById(decoded.userId)
          .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
          .lean();
      } else {
        return NextResponse.json(
          { message: "Invalid user role" },
          { status: 401 }
        );
      }
      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Transform the user object based on role
      const userResponse = {
        id: user._id.toString(),
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        preferredContactNumber: user.preferredContactNumber,
        verified: user.verified,
        role: decoded.role,
        profile: {
          avatar: user.profile?.avatar || null,
          bio: user.profile?.bio || null,
          location: user.profile?.location || null,
          website: user.profile?.website || null,
          education: user.profile?.education || [],
          skills: user.profile?.skills || [],
          socialLinks: user.profile?.socialLinks || {
            linkedin: null,
            github: null,
            twitter: null
          }
        }
      };

      // Add role-specific fields
      if (decoded.role === 'student') {
        userResponse.subjectsOfInterest = user.subjectsOfInterest || [];
      }

      return NextResponse.json({ user: userResponse });

    } catch (err) {
      console.error('Token verification error:', err);
      
      // Check specifically for token expiration
      if (err instanceof jwt.TokenExpiredError) {
        // Clear the auth token cookie
        const cookieStore =await cookies();
        cookieStore.delete('auth-token');
        
        return NextResponse.json(
          { 
            message: "Token expired",
            code: "TOKEN_EXPIRED"  // Add a specific code for client-side handling
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { message: "Authentication failed" },
      { status: 401 }
    );
  }
}
