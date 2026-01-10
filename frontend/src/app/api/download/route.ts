import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('name');

    if (!fileUrl || !fileName) {
        return NextResponse.json({ error: 'Missing url or name' }, { status: 400 });
    }

    try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
            console.error(`Failed to fetch file from ${fileUrl}: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: 'File not found or inaccessible' }, { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Content-Length', response.headers.get('Content-Length') || '');

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Download proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
