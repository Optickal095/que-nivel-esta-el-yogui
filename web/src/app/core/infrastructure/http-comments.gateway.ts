import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CommentsGateway } from '../application/comments.gateway';
import { Comment, CommentDraft } from '../domain/comment.model';
import { API_BASE_URL } from './api-base-url';

type CommentDto = Omit<Comment, 'createdAt'> & { createdAt: string };

const toComment = (dto: CommentDto): Comment => ({ ...dto, createdAt: new Date(dto.createdAt) });

/** HTTP error → Error with a message for the visitor (the API's own message when it sends one). */
export function toVisitorError(error: unknown): Error {
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as { message?: unknown } | null)?.message;
    if (error.status >= 400 && error.status < 500 && typeof message === 'string') {
      return new Error(message);
    }
  }
  return new Error('No se pudo conectar. Inténtalo de nuevo en un rato.');
}

/** Adapter: CommentsGateway over the NestJS API. */
@Injectable()
export class HttpCommentsGateway implements CommentsGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/api/comments`;

  list(): Observable<Comment[]> {
    return this.http.get<CommentDto[]>(this.url).pipe(map((list) => list.map(toComment)));
  }

  post(draft: CommentDraft): Observable<Comment> {
    return this.http.post<CommentDto>(this.url, draft).pipe(
      map(toComment),
      catchError((e: unknown) => throwError(() => toVisitorError(e))),
    );
  }

  checkModerationKey(key: string): Observable<void> {
    return this.http
      .get<void>(`${this.url}/moderation`, { headers: this.auth(key) })
      .pipe(catchError((e: unknown) => throwError(() => toVisitorError(e))));
  }

  remove(id: number, key: string): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${id}`, { headers: this.auth(key) })
      .pipe(catchError((e: unknown) => throwError(() => toVisitorError(e))));
  }

  private auth(key: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${key}` });
  }
}
