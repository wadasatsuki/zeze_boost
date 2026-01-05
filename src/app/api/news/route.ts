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

// 作成・削除・議論作成
export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json();

    // 議論作成 (認証不要 - ユーザーが作成)
    if (body.action === "discuss") {
      const { newsId } = body;

      if (!newsId) {
        return NextResponse.json({ error: "newsId is required" }, { status: 400 });
      }

      // Get news item
      const { data: newsItem, error: newsError } = await supabase
        .from("news")
        .select("*")
        .eq("id", newsId)
        .single();

      if (newsError || !newsItem) {
        return NextResponse.json({ error: "News item not found" }, { status: 404 });
      }

      // Check if discussion already exists for this news
      if (newsItem.discussion_key) {
        return NextResponse.json({
          ok: true,
          discussion_key: newsItem.discussion_key,
          existing: true
        });
      }

      // Check if there's already a discussion with this URL
      if (newsItem.url) {
        const { data: existingDiscussion } = await supabase
          .from("discussions")
          .select("discussion_key")
          .eq("source_url", newsItem.url)
          .single();

        if (existingDiscussion) {
          // Link existing discussion to news item
          await supabase
            .from("news")
            .update({ discussion_key: existingDiscussion.discussion_key })
            .eq("id", newsId);

          return NextResponse.json({
            ok: true,
            discussion_key: existingDiscussion.discussion_key,
            existing: true
          });
        }
      }

      // Create new discussion
      const discussionKey = `news_${Date.now()}`;

      // Fetch page title if URL exists
      let sourceTitle: string | null = null;
      if (newsItem.url) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(newsItem.url, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; ZezeBoost/1.0)" },
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const html = await response.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              sourceTitle = titleMatch[1].trim();
            }
          }
        } catch {
          // Ignore fetch errors
        }
      }

      // Insert discussion
      const { error: discussionError } = await supabase
        .from("discussions")
        .insert([{
          discussion_key: discussionKey,
          title: newsItem.title,
          created_at: new Date().toISOString(),
          source_url: newsItem.url || null,
          source_title: sourceTitle || newsItem.title
        }]);

      if (discussionError) {
        console.error("Error creating discussion:", discussionError);
        return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 });
      }

      // Create auto-generated first post
      let autoPostContent = `💭 **${newsItem.title}**\n\nこのテーマについて自由に議論しましょう！`;
      if (newsItem.url) {
        const linkText = sourceTitle || newsItem.url;
        autoPostContent = `💭 **${newsItem.title}**\n\n🔗 関連リンク: ${linkText}\n\nこのテーマについて自由に議論しましょう！`;
      }

      const postId = `post_${Date.now()}`;
      await supabase
        .from("posts")
        .insert([{
          post_id: postId,
          discussion_key: discussionKey,
          content: autoPostContent,
          is_auto_generated: true,
          created_at: new Date().toISOString()
        }]);

      // Link discussion to news item
      await supabase
        .from("news")
        .update({ discussion_key: discussionKey })
        .eq("id", newsId);

      return NextResponse.json({
        ok: true,
        discussion_key: discussionKey,
        existing: false
      });
    }

    // 以下は管理者認証が必要
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
