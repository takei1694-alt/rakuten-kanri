import { NextRequest, NextResponse } from 'next/server';

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbydpEew2V8rkL1OKqml9eAmz8ZAAzI579cD_JeU45kBuIXXjZJV-fatTEUtodFlyzICUA/exec';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const url = new URL(GAS_API_URL);
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'API request failed' },
      { status: 500 }
    );
  }
}
