import $ from "jquery";
const GmailFactory = require("gmail-js");


export default defineUnlistedScript(() => {
  console.log("whyy")
  const gmail = new GmailFactory.Gmail($) as Gmail;
  let extensionPort: MessagePort | undefined = undefined;

  // 1. Listen for the transferred port from the isolated content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== 'INIT_GMAIL_PORT') {
      return;
    }

    if (event.ports && event.ports.length > 0) {
      extensionPort = event.ports[0];
    }
  });

  // 2. Tell the isolated content script we are ready to receive the port
  window.postMessage({ type: 'GMAIL_MAIN_READY' }, '*');

  // 3. Send email data exclusively through the private MessagePort
  gmail.observe.on('load', () => {
    gmail.observe.on('view_email', (domEmail) => {
      const id = gmail.new.get.email_id(domEmail)
      const emailData = gmail.new.get.email_data(id);
      if (emailData && extensionPort) {
        extensionPort.postMessage({
          type: 'EMAIL_VIEWED',
          payload: {
            subject: emailData.subject,
            from: emailData.from,
            html: domEmail.body(),
            attachments: emailData.attachments
          },
        });
      }
    });
  });
});
