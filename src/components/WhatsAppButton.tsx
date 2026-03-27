'use client';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '18019106171';
const WHATSAPP_MSG = encodeURIComponent('Hola! Me interesa saber más sobre Sabor Web.');

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 24px rgba(37, 211, 102, 0.4)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(37, 211, 102, 0.55)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(37, 211, 102, 0.4)';
      }}
    >
      <MessageCircle size={26} color="#fff" fill="#fff" />
    </a>
  );
}
