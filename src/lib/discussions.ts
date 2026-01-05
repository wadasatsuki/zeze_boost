import { Discussion, Post, DataCard, AreaBounds } from './types';
import fs from 'fs';
import path from 'path';

const DISCUSSIONS_FILE = path.join(process.cwd(), 'data', 'discussions.json');

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadDiscussions(): Record<string, Discussion> {
  ensureDataDir();
  if (!fs.existsSync(DISCUSSIONS_FILE)) {
    return {};
  }
  const content = fs.readFileSync(DISCUSSIONS_FILE, 'utf-8');
  return JSON.parse(content);
}

export function saveDiscussions(discussions: Record<string, Discussion>) {
  ensureDataDir();
  fs.writeFileSync(DISCUSSIONS_FILE, JSON.stringify(discussions, null, 2));
}

export function getDiscussion(discussionKey: string): Discussion | null {
  const discussions = loadDiscussions();
  return discussions[discussionKey] || null;
}

export function createDiscussion(card: DataCard): Discussion {
  const discussions = loadDiscussions();

  const autoPost: Post = {
    id: `post_${Date.now()}`,
    discussion_key: card.discussion_key,
    content: `📊 **${card.title}**\n\n- **値**: ${card.value} ${card.unit}\n- **時点**: ${card.as_of}\n- **出典**: ${card.source_url}\n\n${card.description}`,
    created_at: new Date().toISOString(),
    is_auto_generated: true,
  };

  const discussion: Discussion = {
    discussion_key: card.discussion_key,
    title: card.title,
    posts: [autoPost],
    created_at: new Date().toISOString(),
  };

  discussions[card.discussion_key] = discussion;
  saveDiscussions(discussions);

  return discussion;
}

export function addPost(discussionKey: string, content: string): Post | null {
  const discussions = loadDiscussions();
  const discussion = discussions[discussionKey];

  if (!discussion) {
    return null;
  }

  const post: Post = {
    id: `post_${Date.now()}`,
    discussion_key: discussionKey,
    content,
    created_at: new Date().toISOString(),
    is_auto_generated: false,
  };

  discussion.posts.push(post);
  saveDiscussions(discussions);

  return post;
}

// Generate a discussion key from area bounds
export function generateAreaKey(bounds: AreaBounds): string {
  // Round to 4 decimal places for reasonable precision (~11m accuracy)
  const n = bounds.north.toFixed(4);
  const s = bounds.south.toFixed(4);
  const e = bounds.east.toFixed(4);
  const w = bounds.west.toFixed(4);
  return `area_${n}_${s}_${e}_${w}`;
}

// Find existing discussion for similar area (within tolerance)
export function findAreaDiscussion(bounds: AreaBounds): Discussion | null {
  const discussions = loadDiscussions();
  const tolerance = 0.0005; // ~50m tolerance

  for (const key in discussions) {
    const discussion = discussions[key];
    if (discussion.area_bounds) {
      const ab = discussion.area_bounds;
      if (
        Math.abs(ab.north - bounds.north) < tolerance &&
        Math.abs(ab.south - bounds.south) < tolerance &&
        Math.abs(ab.east - bounds.east) < tolerance &&
        Math.abs(ab.west - bounds.west) < tolerance
      ) {
        return discussion;
      }
    }
  }
  return null;
}

// Create area-based discussion
export function createAreaDiscussion(bounds: AreaBounds, name?: string): Discussion {
  const discussions = loadDiscussions();
  const discussionKey = generateAreaKey(bounds);

  // Format coordinates for display
  const centerLat = ((bounds.north + bounds.south) / 2).toFixed(4);
  const centerLng = ((bounds.east + bounds.west) / 2).toFixed(4);

  // Use provided name or coordinates
  const areaTitle = name || `${centerLat}, ${centerLng}`;
  const locationInfo = name ? `${name}（${centerLat}, ${centerLng} 周辺）` : `${centerLat}, ${centerLng} 周辺`;

  const autoPost: Post = {
    id: `post_${Date.now()}`,
    discussion_key: discussionKey,
    content: `📍 **${locationInfo}についての議論**\n\n**テーマ**: このエリアにはどんなお店、イベント、活動があると良いでしょうか？\n\nぜひあなたのアイデアを共有してください！`,
    created_at: new Date().toISOString(),
    is_auto_generated: true,
  };

  const discussion: Discussion = {
    discussion_key: discussionKey,
    title: `${areaTitle}に何があるといい？`,
    posts: [autoPost],
    created_at: new Date().toISOString(),
    area_bounds: bounds,
  };

  discussions[discussionKey] = discussion;
  saveDiscussions(discussions);

  return discussion;
}
