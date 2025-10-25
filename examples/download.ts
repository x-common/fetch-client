/**
 * File Download Examples
 * 
 * This example demonstrates how to download files using the fetch-client library.
 * Includes downloading different file types, handling large files, progress tracking,
 * and saving files to disk.
 */

import { Client, ApiError } from '../libs/index';
import * as fs from 'fs';
import * as path from 'path';

// Create a client for file downloads
const downloadClient = new Client({
  baseURL: 'https://httpbin.org',
  timeout: 120000, // 2 minutes for downloads
  headers: {
    'User-Agent': 'fetch-client-download-example/1.0.0'
  }
});

// Alternative client for real file downloads
const fileDownloadClient = new Client({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 60000
});

async function demonstrateTextDownload() {
  console.log('📥 Text File Download Example\n');

  try {
    console.log('📄 1. Downloading JSON data as text...');

    // Download JSON data from JSONPlaceholder
    const response = await fileDownloadClient.get('/posts', {
      responseType: 'text' // Force text response
    });

    console.log('✅ Text download completed');
    console.log('   Content type: text');
    console.log('   Size:', (response as string).length, 'characters');
    console.log('   Preview:', (response as string).substring(0, 100) + '...');

    // Save to file
    const outputPath = path.join(__dirname, 'downloaded-posts.json');
    fs.writeFileSync(outputPath, response as string);
    console.log('   💾 Saved to:', outputPath);

    // Clean up
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('   🗑️  Cleaned up downloaded file');
      }
    }, 2000);

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Text download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateJSONDownload() {
  console.log('📥 JSON File Download Example\n');

  try {
    console.log('📋 2. Downloading and parsing JSON data...');

    // Download and automatically parse JSON
    const posts = await fileDownloadClient.get('/posts', {
      params: { _limit: '5' },
      responseType: 'json'
    });

    console.log('✅ JSON download completed');
    console.log('   Content type: application/json');
    console.log('   Items:', (posts as any[]).length);
    console.log('   Sample titles:');
    (posts as any[]).slice(0, 3).forEach((post, i) => {
      console.log(`     ${i + 1}. ${post.title.substring(0, 50)}...`);
    });

    // Save formatted JSON to file
    const outputPath = path.join(__dirname, 'downloaded-posts-formatted.json');
    fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
    console.log('   💾 Saved formatted JSON to:', outputPath);

    // Clean up
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('   🗑️  Cleaned up downloaded file');
      }
    }, 2000);

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ JSON download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateBinaryDownload() {
  console.log('📥 Binary File Download Example\n');

  try {
    console.log('📦 3. Downloading binary data...');

    // Download binary data from httpbin
    const binaryResponse = await downloadClient.get('/bytes/1024', {
      responseType: 'arrayBuffer'
    });

    console.log('✅ Binary download completed');
    console.log('   Content type: application/octet-stream');
    console.log('   Size:', (binaryResponse as ArrayBuffer).byteLength, 'bytes');

    // Convert to Buffer and save
    const buffer = Buffer.from(binaryResponse as ArrayBuffer);
    const outputPath = path.join(__dirname, 'downloaded-binary.bin');
    fs.writeFileSync(outputPath, buffer);
    console.log('   💾 Saved binary file to:', outputPath);

    // Verify file
    const savedFile = fs.readFileSync(outputPath);
    console.log('   ✅ Verification: Saved file size:', savedFile.length, 'bytes');

    // Clean up
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('   🗑️  Cleaned up downloaded file');
      }
    }, 2000);

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Binary download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateBlobDownload() {
  console.log('📥 Blob Download Example\n');

  try {
    console.log('🔄 4. Downloading as Blob...');

    // Download data as Blob
    const blobResponse = await downloadClient.get('/json', {
      responseType: 'blob'
    });

    console.log('✅ Blob download completed');
    const blob = blobResponse as Blob;
    console.log('   Blob size:', blob.size, 'bytes');
    console.log('   Blob type:', blob.type);

    // Convert blob to text for preview
    const text = await blob.text();
    console.log('   Content preview:', text.substring(0, 100) + '...');

    // Convert blob to buffer and save
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const outputPath = path.join(__dirname, 'downloaded-blob.json');
    fs.writeFileSync(outputPath, buffer);
    console.log('   💾 Saved blob content to:', outputPath);

    // Clean up
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('   🗑️  Cleaned up downloaded file');
      }
    }, 2000);

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Blob download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateStreamingDownload() {
  console.log('📥 Streaming Download Example\n');

  try {
    console.log('🌊 5. Simulating streaming download...');

    // For demonstration, we'll download in chunks
    const chunkSize = 256; // Small chunks for demo
    let totalDownloaded = 0;
    const chunks: Buffer[] = [];

    // Download multiple small chunks to simulate streaming
    for (let i = 0; i < 4; i++) {
      console.log(`   📦 Downloading chunk ${i + 1}/4...`);
      
      const chunkResponse = await downloadClient.get(`/bytes/${chunkSize}`, {
        responseType: 'arrayBuffer'
      });

      const chunkBuffer = Buffer.from(chunkResponse as ArrayBuffer);
      chunks.push(chunkBuffer);
      totalDownloaded += chunkBuffer.length;

      console.log(`   ✅ Chunk ${i + 1} downloaded: ${chunkBuffer.length} bytes`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Combine all chunks
    const completeBuffer = Buffer.concat(chunks);
    console.log('✅ Streaming download completed');
    console.log('   Total size:', totalDownloaded, 'bytes');
    console.log('   Combined size:', completeBuffer.length, 'bytes');

    // Save the complete file
    const outputPath = path.join(__dirname, 'downloaded-stream.bin');
    fs.writeFileSync(outputPath, completeBuffer);
    console.log('   💾 Saved streamed file to:', outputPath);

    // Clean up
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('   🗑️  Cleaned up downloaded file');
      }
    }, 2000);

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Streaming download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateDownloadWithHeaders() {
  console.log('📥 Download with Custom Headers Example\n');

  try {
    console.log('🔧 6. Download with custom headers...');

    const response = await downloadClient.get('/headers', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Custom-Download-Client/1.0',
        'X-Download-Purpose': 'example',
        'Cache-Control': 'no-cache'
      },
      responseType: 'json'
    });

    console.log('✅ Download with custom headers completed');
    
    // The response should contain the headers we sent
    const responseData = response as any;
    if (responseData.headers) {
      console.log('   Sent headers were received by server:');
      Object.entries(responseData.headers).slice(0, 3).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Header download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateConditionalDownload() {
  console.log('📥 Conditional Download Example\n');

  try {
    console.log('🔍 7. Conditional download based on content...');

    // First, get information about the resource
    const infoResponse = await fileDownloadClient.get('/posts/1');
    const postInfo = infoResponse as any;

    console.log('   📋 Resource info obtained:');
    console.log(`     Title: ${postInfo.title}`);
    console.log(`     Content length: ${postInfo.body.length} characters`);

    // Conditionally download based on content length
    if (postInfo.body.length > 50) {
      console.log('   ✅ Content meets criteria, proceeding with full download...');
      
      const fullResponse = await fileDownloadClient.get('/posts', {
        params: { userId: postInfo.userId.toString() },
        responseType: 'json'
      });

      const userPosts = fullResponse as any[];
      console.log(`   📥 Downloaded ${userPosts.length} posts from user ${postInfo.userId}`);

      // Save to file
      const outputPath = path.join(__dirname, `user-${postInfo.userId}-posts.json`);
      fs.writeFileSync(outputPath, JSON.stringify(userPosts, null, 2));
      console.log('   💾 Saved to:', outputPath);

      // Clean up
      setTimeout(() => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
          console.log('   🗑️  Cleaned up downloaded file');
        }
      }, 2000);

    } else {
      console.log('   ⏭️  Content too small, skipping full download');
    }

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Conditional download failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Main function to run all download examples
async function main() {
  console.log('🚀 File Download Examples\n');
  console.log('==========================================\n');

  await demonstrateTextDownload();
  await demonstrateJSONDownload();
  await demonstrateBinaryDownload();
  await demonstrateBlobDownload();
  await demonstrateStreamingDownload();
  await demonstrateDownloadWithHeaders();
  await demonstrateConditionalDownload();

  console.log('🎉 All download examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateTextDownload,
  demonstrateJSONDownload,
  demonstrateBinaryDownload,
  demonstrateBlobDownload,
  demonstrateStreamingDownload,
  demonstrateDownloadWithHeaders,
  demonstrateConditionalDownload
};