import { NextResponse } from 'next/server';

// This is a basic implementation - you'll need to integrate with your actual chat service
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, context } = body;

    // Basic validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // TODO: Replace this with your actual chat service integration
    // For now, we'll return a mock response
    const mockResponse = {
      ok: true,
      replyText: `Thank you for your message: "${message}". This is a demo response. Please integrate with your actual chat service.`,
      context: {
        ...context,
        lastMessage: message,
        messageCount: (context?.messageCount || 0) + 1,
      },
      suggestions: [
        {
          id: 'fabric-1',
          fabricCode: 'NOK-001',
          label: 'Cotton Poplin',
          slug: 'cotton-poplin',
          url: '/fabric/cotton-poplin'
        },
        {
          id: 'fabric-2',
          fabricCode: 'MAJ-002',
          label: 'Mercerized Cotton',
          slug: 'mercerized-cotton',
          url: '/fabric/mercerized-cotton'
        }
      ],
      meta: {
        intent: 'fabric_inquiry',
        topScore: 0.85,
        language: 'en',
        openaiUsed: false,
        leadId: context?.leadId || null
      }
    };

    // If contact info is provided, simulate lead creation
    if (context?.contactInfo && Object.keys(context.contactInfo).length > 0) {
      const leadId = `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      mockResponse.context.leadId = leadId;
      mockResponse.meta.leadId = leadId;
      mockResponse.replyText += ` Your contact information has been saved with Lead ID: ${leadId}`;
    }

    return NextResponse.json(mockResponse);

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}