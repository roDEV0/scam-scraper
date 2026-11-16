// Optional: Define a TypeScript interface matching your payload
interface GmailSender {
  name: string;
  address: string;
}

interface EmailMessage {
  source: string;
  type: string;
  payload: {
    subject: string;
    from: GmailSender;
    html: string;
    attachments: GmailDomAttachment[];
  };
}

import { parse } from 'node-html-parser';
import * as linkify from "linkifyjs"

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
    const processingPort = browser.runtime.connect({name: "EMAIL_PROCESSING"})
    const parser = new DOMParser()

    let lastEmailKey = "";
    let lastProcessedTime = 0;
    port1.onmessage = async (event) => {
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
          const attachments = email.attachments;

          const doc = parse(email.html)
          const text = doc.textContent
          const linkedURLs = linkify.find(text).filter(v => v.type === "url").map(v => v.href)
          const linkedEmails = linkify.find(text).filter(v => v.type === "email").map(v => v.href)
          const hyperLinks = doc.querySelectorAll("a").map(a => a.getAttribute("href"))

          console.log(hyperLinks)

          processingPort.postMessage({ type: "PROCESS_EMAIL", payload: {
              subject: email.subject,
              sender: sender.address,
              text: text,
              urls: linkedURLs,
              emails: linkedEmails,
              hyperLinks: hyperLinks
          }})
        }
        if (event.data?.type === "THREAD_VIEWED") {
          console.log("THREAD_VIEWED")
        }
      } catch (e) {
        console.error(e)
      }
    };

    processingPort.onMessage.addListener((message) => {
      if (message.type === "EMAIL_PROCESSED") {
        console.log("Email processed:", message.payload);
      }
    });

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
