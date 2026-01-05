import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs"; // Vercel安定用

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// 一覧取得
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ news: data });
  } catch (e: any) {
    console.error("NEWS_GET_ERROR", e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}

// 作成・削除 (要認証)
export async function POST(req: Request) {
  try {
    // Check admin authentication
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await req.json();

    // 作成
    if (body.action === "create") {
      const { title, url, summary, hashtags } = body;
      if (!title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("news")
        .insert([{ title, url: url || null, summary, hashtags }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ newsItem: data });
    }

    // 編集
    if (body.action === "update") {
      const { id, title, url, summary, hashtags } = body;
      if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      if (!title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("news")
        .update({ title, url: url || null, summary: summary || null, hashtags: hashtags || null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ newsItem: data });
    }

    // 削除
    if (body.action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "id required" }, { status: 400 });
      }

      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    console.error("NEWS_POST_ERROR", e);
    return NextResponse.json({ error: String(e.message ?? e) }, { status: 500 });
  }
}
