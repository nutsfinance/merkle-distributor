import { S3, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk//client-s3";
import fetch from "axios";
import * as dotenv from "dotenv";

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
    const params = {
        Bucket,
        Key: file,
        Body: content
    };

    await s3.send(new PutObjectCommand(params));
}

export const getFile = async (file: string) => {
    // It's easier to file from static site directly
    const response = await fetch(`http://reward-data.s3-website-us-west-1.amazonaws.com/${file}`);
    console.log(response.data)

    return response.data;
}



// createFile("test/data.txt", "Test");

// fileExists("test/data.txt")

getFile("test/data.txt")