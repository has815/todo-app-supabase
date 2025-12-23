import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userContext } = await request.json();

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and powerful model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful todo list assistant. Generate 5 practical, actionable todo items based on user context. Return ONLY a JSON array of strings, nothing else.'
          },
          {
            role: 'user',
            content: userContext || 'Generate 5 general productivity todo items for today'
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate suggestions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No suggestions generated' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let suggestions;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanContent);
    } catch (parseError) {
      // If not valid JSON, split by newlines
      suggestions = content
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 5);
    }

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}