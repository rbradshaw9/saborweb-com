import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hashIntakeToken, readString } from '@/lib/intake/server';
import type { PreviewRequestRecord } from '@/lib/intake/shared';

function cleanFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = readString(form.get('token'));
    const fileRole = readString(form.get('fileRole')) || 'asset';
    const files = form.getAll('files').filter((item): item is File => item instanceof File);

    if (!token) {
      return NextResponse.json({ error: 'Missing intake token.' }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: requestRecord, error: requestError } = await supabase
      .from('preview_requests')
      .select(
        'id, owner_name, email, phone, restaurant_name, city, preferred_language, source, status, notes, instagram_url, google_url, website_url, client_slug'
      )
      .eq('intake_token_hash', hashIntakeToken(token))
      .single();

    if (requestError || !requestRecord) {
      return NextResponse.json({ error: 'Invalid or expired intake link.' }, { status: 404 });
    }

    const request = requestRecord as PreviewRequestRecord;
    const uploaded: Array<{ id: string; fileName: string; path: string }> = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `${file.name} is larger than 10MB.` }, { status: 400 });
      }

      const safeName = cleanFileName(file.name) || 'asset';
      const path = `${request.client_slug}/${crypto.randomUUID()}-${safeName}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('intake-assets')
        .upload(path, bytes, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Intake Files] Upload failed:', uploadError);
        return NextResponse.json({ error: `Could not upload ${file.name}.` }, { status: 500 });
      }

      const { data: fileRecord, error: insertError } = await supabase
        .from('intake_files')
        .insert({
          request_id: request.id,
          file_role: fileRole,
          storage_bucket: 'intake-assets',
          storage_path: path,
          file_name: file.name,
          content_type: file.type || null,
          size_bytes: file.size,
        })
        .select('id, file_name, storage_path')
        .single();

      if (insertError || !fileRecord) {
        console.error('[Intake Files] Metadata insert failed:', insertError);
        return NextResponse.json({ error: `Could not save ${file.name}.` }, { status: 500 });
      }

      uploaded.push({
        id: String(fileRecord.id),
        fileName: String(fileRecord.file_name),
        path: String(fileRecord.storage_path),
      });
    }

    return NextResponse.json({ success: true, files: uploaded });
  } catch (error) {
    console.error('[Intake Files] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
