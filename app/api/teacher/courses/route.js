// app/api/teacher/courses/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.userId).select('-password');

    if (!teacher) {
      return null;
    }

    return {
      id: teacher._id.toString(),
      name: teacher.name,
      email: teacher.email,
      role: 'teacher'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET handler for fetching courses
export async function GET(request) {
  try {
    const user = await verifyAuth();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build query
    const query = { teacherId: user.id };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    return NextResponse.json({
      courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST handler for creating new courses
export async function POST(req) {
  try {
    const user = await verifyAuth();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const courseData = await req.json();

    // Validate required fields
    if (!courseData.title || !courseData.description || !courseData.thumbnail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add order to sections and lessons
    const processedSections = courseData.sections?.map((section, sectionIndex) => ({
      ...section,
      order: sectionIndex + 1, // Add section order
      lessons: section.lessons?.map((lesson, lessonIndex) => ({
        ...lesson,
        order: lessonIndex + 1 // Add lesson order
      })) || []
    })) || [];

    // Calculate duration and lessons count
    const totalDuration = processedSections.reduce((total, section) => {
      return total + (section.lessons?.reduce((sectionTotal, lesson) => {
        return sectionTotal + (parseInt(lesson.duration) || 0);
      }, 0) || 0);
    }, 0);

    const totalLessons = processedSections.reduce((total, section) => {
      return total + (section.lessons?.length || 0);
    }, 0);

    // Create new course document with processed sections
    const course = new Course({
      ...courseData,
      sections: processedSections, // Use processed sections with order
      teacherId: user.id,
      teacherName: user.name,
      status: 'draft',
      enrollments: 0,
      reviews: [],
      rating: 0,
      totalDuration,
      totalLessons
    });

    // Save course
    const savedCourse = await course.save();

    return NextResponse.json({
      message: 'Course created successfully',
      courseId: savedCourse._id,
      course: savedCourse
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating courses
export async function PATCH(request) {
  try {
    const user = await verifyAuth();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, ...updateData } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify course ownership
    const existingCourse = await Course.findOne({
      _id: courseId,
      teacherId: user.id
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found or unauthorized' },
        { status: 404 }
      );
    }

    // If updating status, validate the new status
    if (updateData.status) {
      if (!['draft', 'published', 'archived'].includes(updateData.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }

      // If publishing, check if course has required fields
      if (updateData.status === 'published') {
        if (!existingCourse.title || !existingCourse.description || 
            !existingCourse.thumbnail || !existingCourse.category ||
            !existingCourse.sections || existingCourse.sections.length === 0) {
          return NextResponse.json(
            { error: 'Course must be complete before publishing' },
            { status: 400 }
          );
        }
      }
    }

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    // Update teacher's course stats if needed
    if (updateData.status && updateData.status !== existingCourse.status) {
      const teacher = await Teacher.findById(user.id);
      if (teacher && teacher.stats) {
        const stats = { ...teacher.stats };
        if (updateData.status === 'published') {
          stats.activeCourses = (stats.activeCourses || 0) + 1;
        } else if (existingCourse.status === 'published') {
          stats.activeCourses = Math.max(0, (stats.activeCourses || 0) - 1);
        }
        await Teacher.findByIdAndUpdate(user.id, { stats });
      }
    }

    return NextResponse.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
