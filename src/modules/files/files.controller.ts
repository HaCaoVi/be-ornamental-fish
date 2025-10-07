import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@common/decorators/customize.decorator';
import { FileSizeInterceptor } from '@common/interceptors/multer.interceptor';
import { ERole } from '@common/types/type';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'), FileSizeInterceptor)
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: UploadFileDto
  ) {
    return this.filesService.uploadImage(file, req.folderName, req.oldFileName);
  }

  @Post('upload-video')
  @Roles(ERole.ADMIN, ERole.STAFF)
  @UseInterceptors(FileInterceptor('video'), FileSizeInterceptor)
  uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: UploadFileDto

  ) {
    return this.filesService.uploadVideo(file, req.folderName, req.oldFileName);

  }
}
