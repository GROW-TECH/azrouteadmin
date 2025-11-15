// app/api/events/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Event from '@/models/Event';
import Registration from '@/models/Registration';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const timeframe = searchParams.get('timeframe') || 'upcoming';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;

    await connectDB();

    // Build query
    const query = {
      status: 'published'
    };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All Categories') {
      query.category = category;
    }

    // Type filter
    if (type && type !== 'All Types') {
      query.type = type;
    }

    // Timeframe filter
    const now = new Date();
    if (timeframe === 'upcoming') {
      query.startDate = { $gt: now };
    } else if (timeframe === 'past') {
      query.endDate = { $lt: now };
    }

    // Execute query with pagination
    const events = await Event.find(query)
      .sort({ featured: -1, startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('teacherId', 'name avatar bio designation organization')
      .lean();

    // Get registration counts for each event
    const eventIds = events.map(event => event._id);
    const registrationCounts = await Registration.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          status: { $in: ['confirmed', 'attended'] }
        }
      },
      {
        $group: {
          _id: '$eventId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of registration counts
    const registrationCountMap = new Map(
      registrationCounts.map(item => [item._id.toString(), item.count])
    );

    // Add registration count to each event
    const eventsWithCounts = events.map(event => ({
      ...event,
      registrationCount: registrationCountMap.get(event._id.toString()) || 0
    }));

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    return NextResponse.json(eventsWithCounts, {
      headers: {
        'x-total-count': total.toString(),
        'x-total-pages': Math.ceil(total / limit).toString()
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
