import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { MulterModuleOptions, MulterOptionsFactory } from "@nestjs/platform-express";
import fs from "fs"
import { memoryStorage } from "multer";

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
    getRootPath = () => {
        return process.cwd();
    };

    ensureExistsSync(targetDirectory: string) {
        if (!fs.existsSync(targetDirectory)) {
            fs.mkdirSync(targetDirectory, { recursive: true });
            console.log('Directory created:', targetDirectory);
        }
    }

    createMulterOptions(): MulterModuleOptions {
        return {
            storage: memoryStorage(),
            fileFilter: (req, file, callback) => {
                if (file.fieldname === "image" && !file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                    return callback(
                        new UnprocessableEntityException(
                            `Invalid file type '${file.mimetype}'. Allowed types: jpeg, png, gif, webp`
                        ),
                        false,
                    );
                }

                if (file.fieldname === "video" && !file.mimetype.match(/^video\/(mp4|mov|avi|mkv)$/)) {
                    return callback(
                        new UnprocessableEntityException(
                            `Invalid file type '${file.mimetype}' for video. Allowed types: mp4, mov, avi, mkv`
                        ),
                        false,
                    );
                }
                callback(null, true);
            },
        };
    }
}
