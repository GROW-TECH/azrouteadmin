// app/api/teacher/events/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Event from '@/models/Event';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';



// PATCH endpoint for updating event status
export async function PATCH(request) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    const { eventId, status } = await request.json();

    await connectDB();

    const event = await Event.findOneAndUpdate(
      { 
        _id: eventId,
        teacherId: decoded.userId
      },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Event ${status} successfully`,
      event
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Create new event
export async function POST(request) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    await connectDB();
    const eventData = await request.json();

    // Validate dates
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    const registrationDeadline = new Date(eventData.registrationDeadline);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (registrationDeadline > startDate) {
      return NextResponse.json(
        { error: 'Registration deadline must be before event start date' },
        { status: 400 }
      );
    }

    // Create new event
    const event = new Event({
      ...eventData,
      teacherId: decoded.userId
    });

    // Save event
    await event.save();

    return NextResponse.json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Get all events for a teacher
export async function GET(request) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build query
    const query = { teacherId: decoded.userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(query)
    ]);

    return NextResponse.json({
      events,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
