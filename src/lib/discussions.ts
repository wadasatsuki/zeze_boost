import { Discussion, Post, DataCard } from './types';
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
