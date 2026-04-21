import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#17130f',
          color: '#fbf6ed',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ba4f32',
              color: '#fff',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            SW
          </div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>Sabor Web</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#e7b85f', fontSize: 28, fontWeight: 800, textTransform: 'uppercase' }}>
            Restaurant websites for Puerto Rico
          </div>
          <div style={{ maxWidth: 940, marginTop: 24, fontSize: 78, lineHeight: 1.03, fontWeight: 800 }}>
            We build your preview before you pay.
          </div>
        </div>
      </div>
    ),
    size
  );
}
