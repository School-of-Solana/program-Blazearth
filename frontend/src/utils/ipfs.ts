// Pinata IPFS upload
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export async function uploadToIPFS(file: File): Promise<string> {
    // If no Pinata JWT, fall back to compressed data URL
    if (!PINATA_JWT) {
        console.warn('No Pinata JWT found. Using compressed data URL fallback.');
        return uploadCompressed(file);
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        const ipfsHash = data.IpfsHash;
        const url = `${PINATA_GATEWAY}${ipfsHash}`;

        console.log('Image uploaded to IPFS:', url);
        return url;
    } catch (error) {
        console.error('IPFS upload failed, falling back to compressed:', error);
        return uploadCompressed(file);
    }
}

// Fallback: compressed data URL for demo
async function uploadCompressed(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Max dimensions to keep data URL small
            const MAX_WIDTH = 300;
            const MAX_HEIGHT = 300;

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = (height * MAX_WIDTH) / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = (width * MAX_HEIGHT) / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            const sizeInKB = ((dataUrl.length * 3) / 4) / 1024;

            if (sizeInKB > 5) {
                reject(new Error(`Image too large (${sizeInKB.toFixed(1)}KB). Max 5KB. Get Pinata API key for full-size images.`));
            } else {
                console.log(`Image compressed to ${sizeInKB.toFixed(1)}KB`);
                resolve(dataUrl);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export function getIPFSUrl(uri: string): string {
    if (uri.startsWith('ipfs://')) {
        const hash = uri.replace('ipfs://', '');
        return `https://ipfs.io/ipfs/${hash}`;
    }
    return uri;
}
