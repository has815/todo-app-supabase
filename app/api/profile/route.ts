import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ data: null, success: true }, { status: 200 });
    }

    if (error) {
      console.error('Supabase GET profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 200 });
  } catch (error) {
    console.error('API GET profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await request.json();
    
    const { user_id, name, job } = body;

    if (!user_id || !name || !job) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, name, job' 
      }, { status: 400 });
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let data, error;

    if (existingProfile) {
      const result = await supabase
        .from('profiles')
        .update({ name, job })
        .eq('user_id', user_id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('profiles')
        .insert([{ user_id, name, job }])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase POST profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      data, 
      success: true,
      message: existingProfile ? 'Profile updated' : 'Profile created'
    }, { status: existingProfile ? 200 : 201 });
  } catch (error) {
    console.error('API POST profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await request.json();
    
    const { user_id, name, job } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (job !== undefined) updateData.job = job;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Supabase PUT profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true }, { status: 200 });
  } catch (error) {
    console.error('API PUT profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete profile
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase DELETE profile error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('API DELETE profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}