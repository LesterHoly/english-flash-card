import { NextRequest, NextResponse } from 'next/server';
import { IUserPreferences, DEFAULT_USER_PREFERENCES } from '@/types/user';

// Mock user preferences storage (in real app, this would be in database)
let mockUserPreferences: IUserPreferences = { ...DEFAULT_USER_PREFERENCES };

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Validate the Bearer token
    // 2. Get the user ID from the token
    // 3. Fetch preferences from database with RLS
    
    // For now, return mock preferences
    return NextResponse.json(mockUserPreferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Validate the Bearer token
    // 2. Get the user ID from the token
    // 3. Validate the preferences with Zod schema
    // 4. Update preferences in database with RLS
    
    // For now, update mock preferences
    mockUserPreferences = {
      ...mockUserPreferences,
      ...body
    };

    // Ensure skip_preview is boolean if provided
    if ('skip_preview' in body && typeof body.skip_preview === 'boolean') {
      mockUserPreferences.skip_preview = body.skip_preview;
    }

    return NextResponse.json(mockUserPreferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}