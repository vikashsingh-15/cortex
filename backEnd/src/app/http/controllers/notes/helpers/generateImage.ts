
import fetch from "node-fetch";

export const generateImage = async (imageName: string, path: string, fileName: string, cb: (imageData: Buffer) => void) => {

    console.log('image to :',imageName)

 const prompt_emoji_generator = `
Create a single, clean emoji-style illustration of ${imageName}.

Style: modern emoji design — flat vector aesthetic with soft lighting and very subtle internal depth (2.5D). Rounded, friendly shapes; no hard outlines.
Composition: one centered icon, clear silhouette, with even padding around the icon so it’s legible when scaled down.
Color & lighting: limited palette (3–4 harmonious colors), saturated but accessible; single soft highlight and a gentle internal shadow for volume.
Background: plain white only (no gradients, textures, patterns).
Output requirements: high resolution (1024×1024 or vector/SVG), anti-aliased, sharp edges, optimized to remain legible at 64×64 px.
Restrictions: no text, no additional objects, no framing, no watermark, no photorealism.
Deliverables: PNG (white background) and SVG (vector) if available.
`;

 try {
      const API_KEY = process.env.FIRE_WORKS_API_KEY
    // Step 1: Submit the generation request
    const response = await fetch("https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-kontext-pro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            prompt:prompt_emoji_generator ,
            aspect_ratio: "16:9",
            seed: -1
        }),
    });

    const result = await response.json();
    const requestId = result.request_id;

    if (!requestId) {
        throw new Error("No request ID returned");
    }

    console.log("Request submitted with ID:", requestId);

    // Step 2: Poll for the result
    const resultEndpoint = "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-kontext-pro/get_result";

    for (let attempts = 0; attempts < 60; attempts++) {
        console.log('attempts : -',attempts)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const resultResponse = await fetch(resultEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "image/png",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ id: requestId })
        });

        const pollResult = await resultResponse.json();

        if (['Ready', 'Complete', 'Finished'].includes(pollResult.status)) {
            const imageData = pollResult.result?.sample;

            if (typeof imageData === 'string' && imageData.startsWith('http')) {
                // Download from URL
                const imageResponse = await fetch(imageData);
                const buffer = await imageResponse.arrayBuffer();
                cb(Buffer.from(buffer));
                console.log('Image saved to MongoDB');
                 break;
            } else if (imageData) {
                // Base64 data
                const buffer = Buffer.from(imageData, 'base64');
                cb(buffer);
                console.log('Image saved to MongoDB');
                break;
            }

            if (['Failed', 'Error'].includes(pollResult.status)) {
                throw new Error(`Generation failed: ${pollResult.details || 'Unknown error'}`);
            }

            console.log(`Status: ${pollResult.status}, attempt ${attempts + 1}/60`);
        }
    }
    
 } catch (error) {
    console.log('failed to generate image :',(error as Error)?.message)
    
 }
}
