
// Initialize Supabase Client
// Ensure you have the script tag in your HTML: 
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://wnsbbfqtwbvsglkadnpt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induc2JiZnF0d2J2c2dsa2FkbnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjMyMzgsImV4cCI6MjA4MDYzOTIzOH0.IjD6hOjiWSCRQARTpMPQPvvZHpZ9HC-3zpYqiabL1e4';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export usage for other files (if using modules, but here we use global for simplicity in vanilla JS)
window.supabaseClient = _supabase;
