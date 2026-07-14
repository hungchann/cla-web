import { execSync } from 'child_process';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stdout = execSync('git checkout -- "app/bilingual/[id]/page.tsx"');
    return NextResponse.json({ success: true, stdout: stdout.toString() });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stderr: err.stderr?.toString() });
  }
}
