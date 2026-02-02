// Supabase Edge Function: send-email
// Uses Resend for email delivery
// Setup: Add RESEND_API_KEY to Supabase secrets
// supabase secrets set RESEND_API_KEY=re_xxxxxxxx

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Emlak CRM <noreply@emlakcrm.com>";

interface EmailRequest {
    to: string;
    subject: string;
    body: string;
    type: string;
}

serve(async (req) => {
    // CORS headers
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    try {
        const { to, subject, body, type }: EmailRequest = await req.json();

        if (!to || !subject || !body) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: to, subject, body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // If no API key, log and return success (development mode)
        if (!RESEND_API_KEY) {
            console.log("[DEV MODE] Email would be sent:");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${body}`);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Development mode - email logged but not sent",
                    type
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        // Send email via Resend
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [to],
                subject: subject,
                text: body,
                // For HTML emails, use html: body instead
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Resend API error:", errorData);
            return new Response(
                JSON.stringify({ error: "Failed to send email", details: errorData }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        const result = await response.json();

        return new Response(
            JSON.stringify({ success: true, messageId: result.id, type }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );

    } catch (error) {
        console.error("Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }
});
