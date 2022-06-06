import fs from "fs";
import path from 'path';
import Jimp = require("jimp");
import { Response } from 'express';

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
const ROOT_DIR = path.resolve('./');

export async function filterImageFromURL(inputURL: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const photo = await Jimp.read(inputURL);
      const outpath =
        "/tmp/filtered." + Math.floor(Math.random() * 2000) + ".jpg";
      await photo
        .resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .write(ROOT_DIR + outpath, (img) => {
          resolve(ROOT_DIR + outpath);
        });
    } catch (error) {
      reject(error);
    }
  });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files: Array<string>) {
  for (let file of files) {
    fs.unlinkSync(file);
  }
}

export const sendFileAsync = (sendFileFn: any, fileData: any) => {
  return new Promise((resolve: any, reject: any) => {
    sendFileFn(fileData, (err: any) => {
      if (err) {
        reject(err)
        return;
      }
      resolve()
    })
  })
}

export const sendResp = (res: Response, payload: any, statusCode = 200) => {
  res.status(statusCode).send(payload);
}
