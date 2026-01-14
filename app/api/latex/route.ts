import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const LAMBDA_API_URL =
  "https://20oljrihy1.execute-api.ap-northeast-2.amazonaws.com/default/latex_canonical_transfer_lambda";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latex = searchParams.get("str");

  if (!latex) {
    return NextResponse.json(
      { error: "Missing 'str' parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${LAMBDA_API_URL}?str=${encodeURIComponent(latex)}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Lambda API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
