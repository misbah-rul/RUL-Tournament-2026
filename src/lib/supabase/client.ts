/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These would normally be environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
