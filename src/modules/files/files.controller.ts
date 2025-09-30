import { Controller, Post, Param, Delete, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@common/decorators/customize.decorator';
import { FileSizeInterceptor } from '@common/interceptors/multer.interceptor';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Public()
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'), FileSizeInterceptor)
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: { folderName: string, oldFileName?: string }
  ) {
    return this.filesService.uploadImage(file, req.folderName, req.oldFileName as string);
  }

  @Public()
  @Post('upload-video')
  @UseInterceptors(FileInterceptor('video'), FileSizeInterceptor)
  uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() req: { folderName: string, oldFileName?: string }

  ) {
    return this.filesService.uploadVideo(file, req.folderName, req.oldFileName as string);

  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.filesService.remove(+id);
  // }
}
