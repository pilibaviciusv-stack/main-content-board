import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cukbjcsawvttcuaqjphz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2JqY3Nhd3Z0dGN1YXFqcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTU3OTksImV4cCI6MjA5NzQ5MTc5OX0.QTjyO5gZLaWKnF8ObpBwBD6WmHeOCeGxxokk6wyjrQE'
);

// GET — fetch all excluded video IDs
export async function GET() {
  const { data, error } = await supabase
    .from('workspace')
    .select('value')
    .eq('key', 'excluded_videos')
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ ids: [] });
  }
  return NextResponse.json({ ids: data?.value || [] });
}

// POST — add a video ID to excluded list
export async function POST(req: Request) {
  const { id } = await req.json();
  
  // Get current list
  const { data } = await supabase
    .from('workspace')
    .select('value')
    .eq('key', 'excluded_videos')
    .single();
  
  const current: string[] = data?.value || [];
  if (current.includes(id)) return NextResponse.json({ ids: current });
  
  const updated = [...current, id];
  await supabase.from('workspace').upsert({ key: 'excluded_videos', value: updated });
  return NextResponse.json({ ids: updated });
}

// DELETE — remove a video ID from excluded list
export async function DELETE(req: Request) {
  const { id } = await req.json();
  
  const { data } = await supabase
    .from('workspace')
    .select('value')
    .eq('key', 'excluded_videos')
    .single();
  
  const current: string[] = data?.value || [];
  const updated = current.filter((v: string) => v !== id);
  await supabase.from('workspace').upsert({ key: 'excluded_videos', value: updated });
  return NextResponse.json({ ids: updated });
}
