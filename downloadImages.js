import fs from 'fs';
import path from 'path';
import https from 'https';

const baseUrls = [
    'https://thirtysixstudio.com/peppers/pepperA/',
    'https://thirtysixstudio.com/peppers/pepperB/',
    'https://thirtysixstudio.com/peppers/pepperC/',
    'https://thirtysixstudio.com/peppers/pepperG/'
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const downloadImage = (url, filepath, retries = 3) => {
    return new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        }, (response) => {
            if (response.statusCode === 200) {
                response.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                response.resume();
                reject(new Error(`Request Failed With a Status Code: ${response.statusCode}`));
            }
        });

        request.on('error', async (err) => {
            if (retries > 0) {
                console.log(`Retrying download for ${url}, ${retries} attempts remaining...`);
                try {
                    await delay(1000); // Wait 1 second before retrying
                    const result = await downloadImage(url, filepath, retries - 1);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(err);
            }
        });

        // Set timeout
        request.setTimeout(5000, () => {
            request.destroy();
            if (retries > 0) {
                console.log(`Timeout for ${url}, retrying...`);
                downloadImage(url, filepath, retries - 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('Request timeout'));
            }
        });
    });
};

async function downloadAllImages() {
    for (const baseUrl of baseUrls) {
        const pepperType = baseUrl.split('/').slice(-2)[0];
        const outputDir = path.join('public', 'peppers', pepperType);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Download images with delay between requests
        for (let i = 0; i <= 150; i++) {
            const imageUrl = `${baseUrl}${i}.png`;
            const outputPath = path.join(outputDir, `${i}.png`);
            
            try {
                await downloadImage(imageUrl, outputPath);
                console.log(`Downloaded: ${imageUrl}`);
                await delay(500); // Add 500ms delay between downloads
            } catch (error) {
                console.error(`Failed to download ${imageUrl}:`, error.message);
            }
        }
    }
}

downloadAllImages().catch(console.error); 