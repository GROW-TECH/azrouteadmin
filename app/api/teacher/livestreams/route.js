// app/api/teacher/livestreams/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { unstable_cache } from 'next/cache';
import { LiveStream } from '@/models/LiveStream';
import Course from '@/models/Course';
import Enrollment from '@/models/CourseEnrollment';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';


// Cache livestreams data for 30 seconds
const getCachedLivestreams = unstable_cache(
  async (teacherId) => {
    await connectDB();
    return LiveStream
      .find({ teacherId: new ObjectId(teacherId) })
      .sort({ createdAt: -1 })
      
  },
  ['teacher-livestreams'],
  { revalidate: 30 }
);

async function verifyAuth() {
  const cookieStore =await cookies();
  const token =  cookieStore.get('auth-token');

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
// Get all livestreams for a teacher
export async function GET(request) {
  try {
    const user = await verifyAuth();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use cached data
    const livestreams = await getCachedLivestreams(user.id);

    // Set cache control headers
    const response = NextResponse.json(livestreams);
    response.headers.set('Cache-Control', 'private, s-maxage=30');
    
    return response;

  } catch (error) {
    console.error('Error fetching livestreams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch livestreams' },
      { status: 500 }
    );
  }
}

// Rate limit helper
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Remove old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}

// Schedule a new livestream
export async function POST(req) {
  try {
    const user = await verifyAuth();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { title, description, courseId, scheduledFor, duration } = body;

    // Validate required fields
    if (!title || !description || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

     await connectDB();

    

    try {
      // If courseId is provided, verify course exists and belongs to teacher
      if (courseId) {
        const course = await Course.findOne({
          _id: new ObjectId(courseId),
          teacherId: new ObjectId(user.id)
        });

        if (!course) {
          return NextResponse.json(
            { error: 'Course not found or unauthorized' },
            { status: 404 }
          );
        }
      }

      // Create livestream
      const livestream = {
        teacherId: new ObjectId(user.id),
        teacherName: user.name,
        courseId: courseId ? new ObjectId(courseId) : null,
        title,
        description,
        status: 'scheduled',
        scheduledFor: new Date(scheduledFor),
        duration: duration || 60,
        attendees: [],
        chat: [],
        settings: {
          isChatEnabled: true,
          isQuestionsEnabled: true,
          allowReplays: true
        },
        statistics: {
          totalViews: 0,
          peakViewers: 0,
          averageWatchTime: 0,
          totalInteractions: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await LiveStream.create(livestream);

      if (courseId) {
        // Batch process course update and notifications
        const operations = [
          Course.updateOne(
            { _id: new ObjectId(courseId) },
            {
              $push: {
                livestreams: {
                  _id: result.insertedId,
                  title,
                  scheduledFor: new Date(scheduledFor)
                }
              }
            }
          )
        ];

        const enrolledStudents = await Enrollment
          .find({ courseId: new ObjectId(courseId) })
          

        if (enrolledStudents.length > 0) {
          const notifications = enrolledStudents.map(enrollment => ({
            userId: enrollment.studentId,
            type: 'LIVESTREAM_SCHEDULED',
            title: 'New Live Class Scheduled',
            message: `A new live class "${title}" has been scheduled for ${new Date(scheduledFor).toLocaleString()}`,
            courseId: new ObjectId(courseId),
            livestreamId: result.insertedId,
            read: false,
            createdAt: new Date()
          }));

          // operations.push(
          //   Notification.insertMany(notifications)
          // );
        }

        await Promise.all(operations);
      }


      // Invalidate cache
      await getCachedLivestreams.revalidate(user.id);

      return NextResponse.json({
        message: 'Livestream scheduled successfully',
        livestreamId: result.insertedId
      });

    } catch (error) {
      throw error;
    } finally {
    }

  } catch (error) {
    console.error('Error scheduling livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
