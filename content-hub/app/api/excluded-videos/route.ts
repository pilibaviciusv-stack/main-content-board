import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cukbjcsawvttcuaqjphz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2JqY3Nhd3Z0dGN1YXFqcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTU3OTksImV4cCI6MjA5NzQ5MTc5OX0.QTjyO5gZLaWKnF8ObpBwBD6WmHeOCeGxxokk6wyjrQE'
);

function getKey(hub: string) {
  return `excluded_videos_${hub}`;
}

// GET — fetch all excluded video IDs for a hub
export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get('hub') || 'danas';
  const key = getKey(hub);
  const { data, error } = await supabase
    .from('workspace')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ ids: [] });
  }
  return NextResponse.json({ ids: data?.value || [] });
}

// POST — add a video ID to excluded list
export async function POST(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get('hub') || 'danas';
  const key = getKey(hub);
  const { id } = await req.json();
  
  const { data } = await supabase
    .from('workspace')
    .select('value')
    .eq('key', key)
    .single();
  
  const current: string[] = data?.value || [];
  if (current.includes(id)) return NextResponse.json({ ids: current });
  
  const updated = [...current, id];
  await supabase.from('workspace').upsert({ key, value: updated });
  return NextResponse.json({ ids: updated });
}

// DELETE — remove a video ID from excluded list
export async function DELETE(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get('hub') || 'danas';
  const key = getKey(hub);
  const { id } = await req.json();
  
  const { data } = await supabase
    .from('workspace')
    .select('value')
    .eq('key', key)
    .single();
  
  const current: string[] = data?.value || [];
  const updated = current.filter((v: string) => v !== id);
  await supabase.from('workspace').upsert({ key, value: updated });
  return NextResponse.json({ ids: updated });
}
