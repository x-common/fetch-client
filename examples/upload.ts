/**
 * File Upload Examples
 * 
 * This example demonstrates how to upload files using the fetch-client library.
 * Includes single file upload, multiple file upload, progress tracking,
 * and different upload scenarios.
 */

import { Client, ApiError } from '../libs/index';
import * as fs from 'fs';
import * as path from 'path';

// Create a client for file uploads
const uploadClient = new Client({
  baseURL: 'https://httpbin.org', // Using httpbin for testing uploads
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    'User-Agent': 'fetch-client-upload-example/1.0.0'
  }
});

// For demo purposes, we'll create some sample content
function createSampleFile(filename: string, content: string): string {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

async function demonstrateSingleFileUpload() {
  console.log('📤 Single File Upload Example\n');

  try {
    // Create a sample text file
    const textContent = 'This is a sample text file for upload testing.\nCreated at: ' + new Date().toISOString();
    const textFilePath = createSampleFile('sample.txt', textContent);

    console.log('📄 1. Uploading text file');
    
    // Read the file and create FormData
    const fileContent = fs.readFileSync(textFilePath);
    const formData = new FormData();
    
    // Create a File-like object (in Node.js environment)
    const file = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', file, 'sample.txt');
    formData.append('description', 'Sample text file upload');
    formData.append('category', 'documents');

    // Upload the file
    const uploadResponse = await uploadClient.post('/post', formData, {
      headers: {
        // Don't set Content-Type - let the browser/Node.js set it with boundary
      }
    });

    console.log('✅ File uploaded successfully!');
    console.log('   Response status:', uploadResponse);
    
    // Clean up
    fs.unlinkSync(textFilePath);
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Upload failed:', error.message);
      console.error('   Status:', error.status);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateMultipleFileUpload() {
  console.log('📤 Multiple File Upload Example\n');

  try {
    // Create multiple sample files
    const files = [
      { name: 'document1.txt', content: 'This is the first document content.' },
      { name: 'document2.txt', content: 'This is the second document content.' },
      { name: 'data.json', content: JSON.stringify({ message: 'Sample JSON data', timestamp: Date.now() }, null, 2) }
    ];

    const filePaths: string[] = [];
    const formData = new FormData();

    console.log('📁 Creating and preparing multiple files...');

    files.forEach((file, index) => {
      const filePath = createSampleFile(file.name, file.content);
      filePaths.push(filePath);

      const fileContent = fs.readFileSync(filePath);
      const mimeType = file.name.endsWith('.json') ? 'application/json' : 'text/plain';
      const blob = new Blob([fileContent], { type: mimeType });
      
      formData.append(`file${index}`, blob, file.name);
      console.log(`   📎 Added ${file.name} (${fileContent.length} bytes)`);
    });

    // Add metadata
    formData.append('uploadType', 'multiple');
    formData.append('totalFiles', files.length.toString());
    formData.append('timestamp', new Date().toISOString());

    console.log('\n📤 Uploading multiple files...');
    
    const uploadResponse = await uploadClient.post('/post', formData, {
      timeout: 120000 // 2 minutes for multiple files
    });

    console.log('✅ Multiple files uploaded successfully!');
    console.log('   Total files:', files.length);
    
    // Clean up
    filePaths.forEach(filePath => fs.unlinkSync(filePath));
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Multiple upload failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateImageUpload() {
  console.log('📤 Image Upload Simulation Example\n');

  try {
    // Simulate an image file with binary content
    const imageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      ...Array(100).fill(0).map(() => Math.floor(Math.random() * 256)) // Random binary data
    ]);

    const imagePath = path.join(__dirname, 'sample.png');
    fs.writeFileSync(imagePath, imageData);

    console.log('🖼️  Uploading simulated image file...');

    const formData = new FormData();
    const imageBlob = new Blob([imageData], { type: 'image/png' });
    
    formData.append('image', imageBlob, 'sample.png');
    formData.append('alt', 'Sample uploaded image');
    formData.append('width', '800');
    formData.append('height', '600');

    const uploadResponse = await uploadClient.post('/post', formData, {
      timeout: 90000, // 90 seconds for image upload
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('✅ Image uploaded successfully!');
    console.log('   File size:', imageData.length, 'bytes');
    
    // Clean up
    fs.unlinkSync(imagePath);
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Image upload failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateUploadWithMetadata() {
  console.log('📤 Upload with Rich Metadata Example\n');

  try {
    // Create a document with metadata
    const documentContent = `
# Sample Document

This is a sample document with rich metadata.

Created: ${new Date().toISOString()}
Author: File Upload Example
Version: 1.0

## Content

This document demonstrates uploading files with extensive metadata.
    `.trim();

    const docPath = createSampleFile('document.md', documentContent);
    const fileContent = fs.readFileSync(docPath);

    console.log('📋 Preparing file with rich metadata...');

    const formData = new FormData();
    const docBlob = new Blob([fileContent], { type: 'text/markdown' });
    
    // File content
    formData.append('document', docBlob, 'document.md');
    
    // Rich metadata
    formData.append('title', 'Sample Document');
    formData.append('author', 'Upload Example System');
    formData.append('version', '1.0');
    formData.append('category', 'documentation');
    formData.append('tags', JSON.stringify(['sample', 'demo', 'markdown']));
    formData.append('permissions', JSON.stringify({
      read: ['public'],
      write: ['admin'],
      delete: ['admin']
    }));
    formData.append('uploadedAt', new Date().toISOString());
    formData.append('fileSize', fileContent.length.toString());
    formData.append('checksum', 'sha256-placeholder');

    console.log('📤 Uploading document with metadata...');

    const uploadResponse = await uploadClient.post('/post', formData);

    console.log('✅ Document with metadata uploaded successfully!');
    console.log('   Metadata fields included: title, author, version, category, tags, permissions');
    
    // Clean up
    fs.unlinkSync(docPath);
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Metadata upload failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateUploadValidation() {
  console.log('📤 Upload Validation Example\n');

  try {
    console.log('🔍 Testing upload validation...');

    // Simulate file validation before upload
    const allowedTypes = ['text/plain', 'application/json', 'image/png'];
    const maxFileSize = 1024 * 1024; // 1MB

    const testFile = {
      name: 'test.txt',
      content: 'This is a test file for validation.',
      type: 'text/plain'
    };

    // File size validation
    if (testFile.content.length > maxFileSize) {
      throw new Error('File size exceeds maximum allowed size');
    }

    // File type validation
    if (!allowedTypes.includes(testFile.type)) {
      throw new Error('File type not allowed');
    }

    console.log('✅ File validation passed');

    // Create and upload the validated file
    const filePath = createSampleFile(testFile.name, testFile.content);
    const fileContent = fs.readFileSync(filePath);

    const formData = new FormData();
    const fileBlob = new Blob([fileContent], { type: testFile.type });
    
    formData.append('file', fileBlob, testFile.name);
    formData.append('validated', 'true');
    formData.append('validationPassed', new Date().toISOString());

    const uploadResponse = await uploadClient.post('/post', formData);

    console.log('✅ Validated file uploaded successfully!');
    
    // Clean up
    fs.unlinkSync(filePath);
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Validated upload failed:', error.message);
    } else {
      console.error('❌ Validation error:', error);
    }
  }
}

// Main function to run all upload examples
async function main() {
  console.log('🚀 File Upload Examples\n');
  console.log('==========================================\n');

  await demonstrateSingleFileUpload();
  await demonstrateMultipleFileUpload();
  await demonstrateImageUpload();
  await demonstrateUploadWithMetadata();
  await demonstrateUploadValidation();

  console.log('🎉 All upload examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateSingleFileUpload,
  demonstrateMultipleFileUpload,
  demonstrateImageUpload,
  demonstrateUploadWithMetadata,
  demonstrateUploadValidation
};