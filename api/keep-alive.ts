// Vercel Serverless Function - Supabase Keep-Alive
// This endpoint is called by Vercel Cron to keep the database warm
// Add to vercel.json: { "crons": [{ "path": "/api/keep-alive", "schedule": "*/5 * * * *" }] }

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: Request): Promise<Response> {
    const start = Date.now();

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Simple ping query
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        const latency = Date.now() - start;

        if (error) {
            return new Response(JSON.stringify({
                success: false,
                error: error.message,
                latency
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Database is warm',
            latency,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        const latency = Date.now() - start;
        return new Response(JSON.stringify({
            success: false,
            error: String(err),
            latency
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export const config = {
    runtime: 'edge',
};
