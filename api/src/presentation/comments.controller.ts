import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import {
  DeleteComment,
  ListComments,
  PostComment,
} from '../application/comments';
import {
  CommentNotFoundError,
  CommentRateLimitedError,
  InvalidCommentError,
} from '../application/errors';
import { Comment } from '../domain/comment';
import { AdminTokenGuard } from './admin-token.guard';

export function toCommentDto(c: Comment) {
  return {
    id: c.id,
    author: c.author,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Non-reversible id of the visitor for the cooldown: the IP is never stored. */
export function clientKeyOf(req: Request): string {
  return createHash('sha256')
    .update(`yogui-comments:${req.ip ?? 'unknown'}`)
    .digest('hex');
}

export interface CommentBody {
  author: string;
  body: string;
  /** Honeypot: hidden field that only bots fill in. */
  website: string;
}

export function parseCommentBody(body: unknown): CommentBody {
  if (typeof body !== 'object' || body === null)
    throw new BadRequestException('JSON body required');
  const { author, body: text, website } = body as Record<string, unknown>;
  if (typeof text !== 'string')
    throw new BadRequestException('"body" must be a string');
  if (author !== undefined && typeof author !== 'string')
    throw new BadRequestException('"author" must be a string');
  return {
    author: author ?? '',
    body: text,
    website: typeof website === 'string' ? website : '',
  };
}

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly listComments: ListComments,
    private readonly postComment: PostComment,
    private readonly deleteComment: DeleteComment,
  ) {}

  @Get()
  async list() {
    return (await this.listComments.execute()).map(toCommentDto);
  }

  @Post()
  async create(@Body() raw: unknown, @Req() req: Request) {
    const input = parseCommentBody(raw);
    if (input.website) throw new BadRequestException('Comentario rechazado.');
    try {
      const comment = await this.postComment.execute({
        author: input.author,
        body: input.body,
        clientKey: clientKeyOf(req),
      });
      return toCommentDto(comment);
    } catch (error) {
      if (error instanceof InvalidCommentError)
        throw new BadRequestException(error.message);
      if (error instanceof CommentRateLimitedError)
        throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
      throw error;
    }
  }

  /** Lets the web check a moderation key before showing the delete buttons. */
  @Get('moderation')
  @UseGuards(AdminTokenGuard)
  @HttpCode(204)
  checkModeration(): void {}

  @Delete(':id')
  @UseGuards(AdminTokenGuard)
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.deleteComment.execute(id);
    } catch (error) {
      if (error instanceof CommentNotFoundError)
        throw new NotFoundException(error.message);
      throw error;
    }
  }
}
