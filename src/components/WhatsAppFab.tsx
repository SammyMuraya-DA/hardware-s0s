const WhatsAppFab = () => (
  <a
    href="https://wa.me/254727607125"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
    className="group fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-success text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    style={{ backgroundColor: '#25D366' }}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
      <path d="M20.52 3.48A11.93 11.93 0 0 0 12.07 0C5.45 0 .07 5.38.07 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0 0 12.07 24h.01c6.62 0 12-5.38 12-12 0-3.2-1.25-6.21-3.56-8.52ZM12.08 21.8h-.01a9.79 9.79 0 0 1-4.99-1.36l-.36-.21-3.67.96.98-3.58-.23-.37A9.81 9.81 0 0 1 2.27 12c0-5.42 4.41-9.83 9.83-9.83 2.62 0 5.09 1.02 6.94 2.88a9.77 9.77 0 0 1 2.88 6.95c0 5.42-4.41 9.8-9.84 9.8Zm5.39-7.34c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.46-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.19-.24-.58-.49-.5-.66-.51l-.56-.01a1.07 1.07 0 0 0-.78.36c-.27.3-1.02 1-1.02 2.43s1.05 2.83 1.2 3.02c.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.61.7.22 1.34.19 1.85.12.56-.08 1.75-.71 2-1.4.25-.7.25-1.29.17-1.4-.07-.12-.27-.2-.57-.34Z"/>
    </svg>
    <span className="absolute right-full mr-3 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      Need help?
    </span>
  </a>
);

export default WhatsAppFab;