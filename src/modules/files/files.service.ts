// files.service.ts
import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class FilesService {
  private bucket: Bucket;
  constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: admin.app.App) {
    this.bucket = this.firebaseApp.storage().bucket();
  }

  async deleteFile(oldFileName: string) {
    try {
      const oldFileRef = this.bucket.file(oldFileName);
      await oldFileRef.delete();
      console.log(`Deleted old file: ${oldFileName}`);
    } catch (err) {
      console.warn(`Failed to delete old file: ${oldFileName}`, err);
    }
  }

  async uploadImage(file: Express.Multer.File, folderName: string, oldFileName: string[]) {
    const filename = `files/images/${folderName}/${uuidv4()}-${Date.now()}-${file.originalname}`;
    const fileRef = this.bucket.file(filename);

    if (oldFileName && oldFileName.length > 0) {
      for (const e of oldFileName) {
        this.deleteFile(e)
      }
    }


    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    return {
      fileName: filename,
      url: `https://storage.googleapis.com/${this.bucket.name}/${filename}`,
    };
  }

  async uploadVideo(file: Express.Multer.File, folderName: string, oldFileName: string) {
    const filename = `files/videos/${folderName}/${uuidv4()}-${Date.now()}-${file.originalname}`;
    const fileRef = this.bucket.file(filename);

    if (oldFileName || oldFileName.length > 0) {
      this.deleteFile(oldFileName)
    }

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    return {
      fileName: filename,
      url: `https://storage.googleapis.com/${this.bucket.name}/${filename}`,
    };
  }
}