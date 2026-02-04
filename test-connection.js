
import { createClient } from '@supabase/supabase-js';

// Values from config.ts fallback
const supabaseUrl = "https://ofttxfmbhulnpbegliwp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdHR4Zm1iaHVsbnBiZWdsaXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTk5MjAsImV4cCI6MjA4MDY3NTkyMH0._ntPFIsWPmWIiOFh0h6-BymsS4Izwftom9NbfmgQe88";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log("Testing connection...");
    const start = Date.now();
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("Connection failed:", error);
        } else {
            console.log("Connection successful!");
            console.log("Data:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
    console.log("Time taken:", Date.now() - start, "ms");
}

testConnection();
