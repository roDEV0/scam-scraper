// Optional: Define a TypeScript interface matching your payload
interface EmailMessage {
  source: string;
  type: string;
  payload: {
    subject: string;
    from: { address: string; name: string };
    html: string;
  };
}

export default defineContentScript({
  matches: ['https://mail.google.com/*'],
  async main() {

    const channel = new MessageChannel();
    const port1 = channel.port1;

    port1.onmessage = (event) => {
      if (event.data?.type === 'EMAIL_VIEWED') {
        const email = event.data.payload;
        console.log('Private channel received email:', email.subject);
      }
    };

    const initHandler = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== 'GMAIL_MAIN_READY') {
        return;
      }

      // Transfer port2 to the MAIN world
      window.postMessage({ type: 'INIT_GMAIL_PORT' }, '*', [channel.port2]);
      window.removeEventListener('message', initHandler);
    };

    window.addEventListener('message', initHandler);

    // 4. Inject the main-world script
    await injectScript('/gmail-main.js', {
      keepInDom: true,
    });


  }
});
