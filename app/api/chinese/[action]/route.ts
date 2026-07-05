import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  try {
    const body = await request.json();
    const response = await axios.post(
      `https://marutek.space/api/chinese/${action}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error in proxy POST /api/chinese/${action}:`, error.message);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);
  try {
    const response = await axios.get(
      `https://marutek.space/api/chinese/${action}`,
      {
        params: Object.fromEntries(searchParams.entries()),
        timeout: 30000,
      }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error in proxy GET /api/chinese/${action}:`, error.message);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: error.response?.status || 500 }
    );
  }
}
