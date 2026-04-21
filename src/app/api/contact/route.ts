import { NextRequest } from 'next/server';
import { POST as createPreviewRequest } from '@/app/api/preview-request/route';

export async function POST(req: NextRequest) {
  return createPreviewRequest(req);
}
