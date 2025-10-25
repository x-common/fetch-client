/**
 * Basic HTTP Methods Examples
 * 
 * This example demonstrates how to use all the basic HTTP methods
 * (GET, POST, PUT, PATCH, DELETE, HEAD) with the fetch-client library.
 */

import { Client, ApiError } from '../libs/index';

// Create a client instance pointing to JSONPlaceholder API
const api = new Client({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'fetch-client-examples/1.0.0'
  }
});

// Type definitions for better TypeScript support
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

async function demonstrateBasicMethods() {
  console.log('🚀 Basic HTTP Methods Examples\n');

  try {
    // 1. GET - Retrieve a single resource
    console.log('📡 1. GET - Fetching single post');
    const post = await api.get<Post>('/posts/1');
    console.log('✅ Post:', post.title);
    console.log('   Body preview:', post.body.substring(0, 50) + '...');
    console.log();

    // 2. GET with query parameters - Retrieve multiple resources
    console.log('📡 2. GET with params - Fetching posts by user');
    const userPosts = await api.get<Post[]>('/posts', {
      params: {
        userId: '1',
        _limit: '3'
      }
    });
    console.log(`✅ Found ${userPosts.length} posts by user 1`);
    userPosts.forEach((p, i) => console.log(`   ${i + 1}. ${p.title}`));
    console.log();

    // 3. POST - Create a new resource
    console.log('📡 3. POST - Creating new post');
    const newPost = await api.post<Post>('/posts', {
      title: 'My New Post',
      body: 'This is the content of my new post created via API',
      userId: 1
    });
    console.log('✅ Created post with ID:', newPost.id);
    console.log('   Title:', newPost.title);
    console.log();

    // 4. PUT - Update entire resource
    console.log('📡 4. PUT - Updating entire post');
    const updatedPost = await api.put<Post>('/posts/1', {
      id: 1,
      title: 'Updated Post Title',
      body: 'This is the updated content of the post',
      userId: 1
    });
    console.log('✅ Updated post:', updatedPost.title);
    console.log();

    // 5. PATCH - Partial update
    console.log('📡 5. PATCH - Partial update of post');
    const patchedPost = await api.patch<Post>('/posts/1', {
      title: 'Partially Updated Title'
    });
    console.log('✅ Patched post:', patchedPost.title);
    console.log();

    // 6. DELETE - Remove resource
    console.log('📡 6. DELETE - Removing post');
    await api.delete('/posts/1');
    console.log('✅ Post deleted successfully');
    console.log();

    // 7. HEAD - Get headers only
    console.log('📡 7. HEAD - Getting headers only');
    const headResponse = await api.head<{status: boolean}>('/posts/1');
    console.log('✅ Response received (headers only)');
    console.log('   Status:', headResponse.status);
    console.log();

    // 8. GET - Fetch users to demonstrate object handling
    console.log('📡 8. GET - Fetching users list');
    const users = await api.get<User[]>('/users', {
      params: { _limit: '3' }
    });
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) from ${user.address.city}`);
    });
    console.log();

    console.log('🎉 All basic HTTP methods demonstrated successfully!');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ API Error:', error.message);
      console.error('   Status:', error.status);
      console.error('   Code:', error.code);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Advanced examples with different configurations
async function demonstrateAdvancedMethods() {
  console.log('\n🔧 Advanced HTTP Methods Examples\n');

  try {
    // Custom headers for specific request
    console.log('📡 1. GET with custom headers');
    const customHeaderPost = await api.get<Post>('/posts/1', {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Custom-Header': 'custom-value'
      }
    });
    console.log('✅ Post with custom headers:', customHeaderPost.title);
    console.log();

    // POST with different content types
    console.log('📡 2. POST with form data simulation');
    const formDataPost = await api.post('/posts', {
      title: 'Form Data Post',
      body: 'This simulates form data submission',
      userId: 2
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('✅ Form data post created:', formDataPost);
    console.log();

    // Multiple requests in parallel
    console.log('📡 3. Parallel requests');
    const [post1, post2, post3] = await Promise.all([
      api.get<Post>('/posts/1'),
      api.get<Post>('/posts/2'),
      api.get<Post>('/posts/3')
    ]);
    console.log('✅ Parallel requests completed:');
    console.log(`   Post 1: ${post1.title}`);
    console.log(`   Post 2: ${post2.title}`);
    console.log(`   Post 3: ${post3.title}`);
    console.log();

    console.log('🎉 Advanced HTTP methods demonstrated successfully!');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ API Error:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Run the examples
async function main() {
  await demonstrateBasicMethods();
  await demonstrateAdvancedMethods();
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export { demonstrateBasicMethods, demonstrateAdvancedMethods };