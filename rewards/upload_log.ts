import { createFile } from './lib/aws_utils';
import * as fs from 'fs';

const main = async () => {
    const filename = process.env.LOG_FILE as string;
    const content = fs.readFileSync(filename).toString();
    console.log(content);
    await createFile(`logs/${filename}`, content);
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
})