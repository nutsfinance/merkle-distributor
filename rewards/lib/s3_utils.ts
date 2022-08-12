import { S3, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk//client-s3";
import fetch from "axios";
import * as dotenv from "dotenv";
import * as fs from 'fs';

dotenv.config();

const s3 = new S3({ region: "us-west-1" });
const Bucket = "reward-data";

export const fileExists = async (file: string) => {
    const command = new HeadObjectCommand({
        Bucket,
        Key: file
    });
    try {
        await s3.send(command);
        return true;
    } catch (error) {
        return false;
    }
}

export const createFile = async (file: string, content: string) => {
    console.log(`Creating file: ${file}`);
    const params = {
        Bucket,
        Key: file,
        Body: content
    };

    await s3.send(new PutObjectCommand(params));
}

export const getFile = async (file: string) => {
    console.log(`Reading file: ${file}`);
    // It's easier to file from static site directly
    const response = await fetch(`http://reward-data.s3-website-us-west-1.amazonaws.com/${file}`);
    if (response.status != 200) return "";

    return response.data;
}

/**
 * Localized versioon of the file handlers. 
 */

// export const fileExists = async (file: string) => {
//     const filePath = __dirname + '/../data/' + file;
//     return fs.existsSync(filePath);
// }

// export const createFile = async (file: string, content: string) => {
//     const filePath = __dirname + '/../data/' + file;
//     fs.writeFileSync(filePath, content);
// }

// export const getFile = async (file: string) => {
//     const filePath = __dirname + '/../data/' + file;
//     return fs.readFileSync(filePath).toString();
// }