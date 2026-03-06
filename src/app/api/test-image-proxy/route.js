import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the image proxy with a known Cloudinary URL
    const testImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const encodedUrl = encodeURIComponent(testImageUrl);
    
    // Get the base URL for the current request
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const proxyUrl = `${baseUrl}/api/image-proxy?url=${encodedUrl}`;
    
    const response = await fetch(proxyUrl);
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      message: response.ok ? 'Image proxy is working correctly' : 'Image proxy failed',
      testUrl: testImageUrl,
      proxyUrl: proxyUrl
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Image proxy test failed'
    }, { status: 500 });
  }
}