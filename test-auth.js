
import { createClient } from '@supabase/supabase-js';

// Values from config.ts fallback
const supabaseUrl = "https://ofttxfmbhulnpbegliwp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdHR4Zm1iaHVsbnBiZWdsaXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTk5MjAsImV4cCI6MjA4MDY3NTkyMH0._ntPFIsWPmWIiOFh0h6-BymsS4Izwftom9NbfmgQe88";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    console.log("Testing Auth...");
    const email = `node_test_${Date.now()}@example.com`;
    const password = "password123";

    console.log("Attempting SignUp with:", email);
    const start = Date.now();

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: "Node Test User" }
            }
        });

        if (error) {
            console.error("SignUp Failed:", error);
        } else {
            console.log("SignUp Successful:", data.user ? data.user.id : "No user obj");

            // Try SignIn
            console.log("Attempting SignIn...");
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                console.error("SignIn Failed:", signInError);
            } else {
                console.log("SignIn Successful! User ID:", signInData.session?.user.id);
            }
        }

    } catch (e) {
        console.error("Exception:", e);
    }
    console.log("Time taken:", Date.now() - start, "ms");
}

testAuth();
