import { createClient } from "npm:@supabase/supabase-js@2";
import { StreamChat } from "npm:stream-chat@9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request: Request) => {
  // Handle CORS
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // =========================
    // 1. CEK AUTH SUPABASE
    // =========================
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =========================
    // 2. CONNECT SUPABASE
    // =========================
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    // =========================
    // 3. AMBIL USER LOGIN
    // =========================
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Sesi Supabase tidak valid",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =========================
    // 4. AMBIL STREAM KEY + SECRET
    // =========================
    const streamApiKey = Deno.env.get("STREAM_API_KEY");
    const streamApiSecret = Deno.env.get("STREAM_API_SECRET");

    if (!streamApiKey) {
      return new Response(
        JSON.stringify({
          error: "STREAM_API_KEY belum dikonfigurasi",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!streamApiSecret) {
      return new Response(
        JSON.stringify({
          error: "STREAM_API_SECRET belum dikonfigurasi",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =========================
    // 5. BUAT SERVER CLIENT STREAM
    // =========================
    const serverClient = StreamChat.getInstance(
      streamApiKey,
      streamApiSecret,
    );

    // =========================
    // 6. BUAT TOKEN STREAM
    // =========================
    const token = serverClient.createToken(user.id);

    // =========================
    // 7. KIRIM TOKEN KE HP
    // =========================
    return new Response(
      JSON.stringify({
        token,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("STREAM TOKEN ERROR:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});