// Optional: Define a TypeScript interface matching your payload
interface EmailMessage {
  source: string;
  type: string;
  payload: {
    subject: string;
    from: string;
    html: string;
    attachments: GmailDomAttachment[];
  };
}

import { parse } from 'node-html-parser';


function extractTextFromHtml(html?: string): string {
  if (!html) return "";

  const template = document.createElement("template");
  template.innerHTML = html;

  // Remove style and script tags so CSS/JS doesn't pollute the text
  template.content
    .querySelectorAll("style, script, noscript")
    .forEach((el) => el.remove());

  return (template.content.textContent || "").replace(/\s+/g, " ").trim();
}

export default defineContentScript({
  matches: ["https://mail.google.com/*"],
  runAt: "document_start",
  allFrames: false,
  async main() {
    const channel = new MessageChannel();
    const port1 = channel.port1;
    const parser = new DOMParser()


    let lastEmailKey = "";
    let lastProcessedTime = 0;
    port1.onmessage = (event) => {
      try {
        if (event.data?.type === "EMAIL_VIEWED") {
          const emailData = event.data as EmailMessage;
          const email = emailData.payload;
          const emailKey = `${email.from}|${email.subject}|${email.html?.slice(0, 100)}`;
          const now = Date.now();

          // Ignore duplicate events for the same email within 2 seconds
          if (emailKey === lastEmailKey && now - lastProcessedTime < 2000) {
            return;
          }

          lastEmailKey = emailKey;
          lastProcessedTime = now;


          const sender = email.from;
          const attachment = email.attachments;
          console.log("Data: ", sender, attachment)

          console.log(email.html)
          const doc = parse(email.html)
          console.log(doc.textContent, "hi?")
        }
      } catch (e) {
        console.error(e)
      }
    };

    const initHandler = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== "GMAIL_MAIN_READY") {
        return;
      }

      // Transfer port2 to the MAIN world
      window.postMessage({ type: "INIT_GMAIL_PORT" }, "*", [channel.port2]);
      window.removeEventListener("message", initHandler);
    };

    window.addEventListener("message", initHandler);

    // 4. Inject the main-world script
    await injectScript("/gmail-main.js", {
      keepInDom: true,
    });
  },
});
