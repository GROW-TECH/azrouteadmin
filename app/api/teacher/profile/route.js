// app/api/teacher/profile/route.js
import { cookies } from 'next/headers';
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = cookies().get('auth-token');

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const teacher = await Teacher.findById(decoded.userId)
      .select('-password -verificationToken -resetPasswordToken');

    if (!teacher) {
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || null,
      phone: teacher.phone || null,
      location: teacher.location || null
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
