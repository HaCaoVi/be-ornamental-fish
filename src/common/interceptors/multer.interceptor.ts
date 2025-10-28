import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileSizeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 50MB

    const file = req.file;

    if (!file) {
      throw new UnprocessableEntityException('No file uploaded');
    }

    if (file.fieldname === 'image' && file.size > MAX_IMAGE_SIZE) {
      throw new UnprocessableEntityException('Image max size is 5MB');
    }

    if (file.fieldname === 'video' && file.size > MAX_VIDEO_SIZE) {
      throw new UnprocessableEntityException('Video max size is 50MB');
    }

    return next.handle();
  }
}
