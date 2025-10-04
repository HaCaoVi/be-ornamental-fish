import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Roles } from '@common/decorators/customize.decorator';
import { FileSizeInterceptor } from '@common/interceptors/multer.interceptor';
import { ERole } from '@common/types/type';
import { UploadImageDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Public()
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'), FileSizeInterceptor)
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: UploadImageDto
  ) {
    return this.filesService.uploadImage(file, req.folderName, req.oldFileName);
  }

  @Public()
  @Roles(ERole.ADMIN, ERole.STAFF)
  @Post('upload-video')
  @UseInterceptors(FileInterceptor('video'), FileSizeInterceptor)
  uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: { folderName: string, oldFileName?: string }

  ) {
    return this.filesService.uploadVideo(file, req.folderName, req.oldFileName as string);

  }
}
