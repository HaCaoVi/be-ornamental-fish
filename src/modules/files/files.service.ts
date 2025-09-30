// files.service.ts
import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: admin.app.App) { }

  async uploadImage(file: Express.Multer.File, folderName: string, oldFileName: string) {
    const bucket = this.firebaseApp.storage().bucket();
    const filename = `files/images/${folderName}/${uuidv4()}-${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(filename);

    if (oldFileName || oldFileName.length > 0) {
      const oldFileRef = bucket.file(oldFileName);
      try {
        await oldFileRef.delete();
        console.log(`Deleted old file: ${oldFileName}`);
      } catch (err) {
        console.warn(`Failed to delete old file: ${oldFileName}`, err);
      }
    }


    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    return {
      fileName: filename,
      url: `https://storage.googleapis.com/${bucket.name}/${filename}`,
    };
  }

  async uploadVideo(file: Express.Multer.File, folderName: string, oldFileName: string) {
    const bucket = this.firebaseApp.storage().bucket();
    const filename = `files/videos/${folderName}/${uuidv4()}-${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(filename);

    if (oldFileName || oldFileName.length > 0) {
      const oldFileRef = bucket.file(oldFileName);
      try {
        await oldFileRef.delete();
        console.log(`Deleted old file: ${oldFileName}`);
      } catch (err) {
        console.warn(`Failed to delete old file: ${oldFileName}`, err);
      }
    }

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    return {
      fileName: filename,
      url: `https://storage.googleapis.com/${bucket.name}/${filename}`,
    };
  }
}