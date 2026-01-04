export interface DataCard {
  id: string;
  title: string;
  theme: string;
  area: string;
  value: string;
  unit: string;
  as_of: string;
  description: string;
  source_url: string;
  discussion_key: string;
}

export interface Post {
  id: string;
  discussion_key: string;
  content: string;
  created_at: string;
  is_auto_generated: boolean;
}

export interface Discussion {
  discussion_key: string;
  title: string;
  posts: Post[];
  created_at: string;
}
