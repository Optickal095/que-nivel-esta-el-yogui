import { CommentStore } from '../../application/ports';
import { Comment, CommentDraft } from '../../domain/comment';
import { PrismaService } from './prisma.service';

const PUBLIC_FIELDS = {
  id: true,
  author: true,
  body: true,
  createdAt: true,
} as const;

/** Repository: comments on Postgres via Prisma. clientKey never leaves this class. */
export class PrismaCommentStore implements CommentStore {
  constructor(private readonly prisma: PrismaService) {}

  listComments(limit: number): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  addComment(
    draft: CommentDraft,
    createdAt: Date,
    clientKey: string,
  ): Promise<Comment> {
    return this.prisma.comment.create({
      select: PUBLIC_FIELDS,
      data: { ...draft, createdAt, clientKey },
    });
  }

  async deleteComment(id: number): Promise<boolean> {
    const { count } = await this.prisma.comment.deleteMany({ where: { id } });
    return count > 0;
  }

  async lastCommentAt(clientKey: string): Promise<Date | null> {
    const row = await this.prisma.comment.findFirst({
      select: { createdAt: true },
      where: { clientKey },
      orderBy: { createdAt: 'desc' },
    });
    return row?.createdAt ?? null;
  }
}
