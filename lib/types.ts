export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
}

export interface Movie {
  id: string;
  user_id: string;
  title: string;
  year: number | null;
  genre: string | null;
  director: string | null;
  poster_url: string | null;
  created_at: string;
}

export type WatchStatus = "watched" | "want_to_watch";

export interface WatchlistEntry {
  id: string;
  user_id: string;
  movie_id: string;
  status: WatchStatus;
  rating: number | null;
  review: string | null;
  watched_at: string | null;
  created_at: string;
  movie?: Movie;
}

export type FriendshipStatus = "pending" | "accepted";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface FeedItem {
  id: string;
  username: string;
  action: WatchStatus;
  movie_title: string;
  movie_year: number | null;
  movie_genre: string | null;
  movie_director: string | null;
  movie_poster_url: string | null;
  rating: number | null;
  review: string | null;
  watched_at: string | null;
  created_at: string;
}

export interface Conversation {
  friend_id: string;
  username: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}
