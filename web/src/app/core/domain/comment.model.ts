/** Visitors' comments (front-end model). Limits mirror the API's rules. */
export interface Comment {
  id: number;
  author: string;
  body: string;
  createdAt: Date;
}

export interface CommentDraft {
  author: string;
  body: string;
  /** Honeypot: hidden field; only bots fill it in. */
  website: string;
}

export const AUTHOR_MAX_LENGTH = 40;
export const BODY_MAX_LENGTH = 500;
