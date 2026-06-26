import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cukbjcsawvttcuaqjphz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2JqY3Nhd3Z0dGN1YXFqcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTU3OTksImV4cCI6MjA5NzQ5MTc5OX0.QTjyO5gZLaWKnF8ObpBwBD6WmHeOCeGxxokk6wyjrQE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
