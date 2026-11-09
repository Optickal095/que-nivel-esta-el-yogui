import { Module } from '@nestjs/common';
import {
  DeleteComment,
  ListComments,
  PostComment,
} from './application/comments';
import { CLOCK, COMMENT_STORE, Clock, CommentStore } from './application/ports';
import { PrismaCommentStore } from './infrastructure/persistence/prisma-comment.store';
import { PrismaService } from './infrastructure/persistence/prisma.service';
import { AdminTokenGuard } from './presentation/admin-token.guard';
import { CommentsController } from './presentation/comments.controller';
import { SharedModule } from './shared.module';

/** Composition root for visitors' comments: port → adapter and use case factories. */
@Module({
  imports: [SharedModule],
  controllers: [CommentsController],
  providers: [
    {
      provide: COMMENT_STORE,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommentStore(prisma),
    },
    {
      provide: ListComments,
      inject: [COMMENT_STORE],
      useFactory: (store: CommentStore) => new ListComments(store),
    },
    {
      provide: PostComment,
      inject: [COMMENT_STORE, CLOCK],
      useFactory: (store: CommentStore, clock: Clock) =>
        new PostComment(store, clock),
    },
    {
      provide: DeleteComment,
      inject: [COMMENT_STORE],
      useFactory: (store: CommentStore) => new DeleteComment(store),
    },
    AdminTokenGuard,
  ],
})
export class CommentsModule {}
