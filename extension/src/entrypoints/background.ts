
export default defineBackground(() => {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "EMAIL_PROCESSING") return;

    console.log("Email processing connection established");

    port.onMessage.addListener(async (message) => {
      if (message.type !== "PROCESS_EMAIL") return;

      try {
        const {
          subject,
          sender,
          text,
          urls,
          emails,
          hyperLinks
        } = message.payload;

        const processed = await sendToAPI(
            subject,
            sender,
            text,
            urls,
            emails,
            hyperLinks
        );

        port.postMessage({
          type: "EMAIL_PROCESSED",
          payload: processed
        });

      } catch (error) {
        console.error("Email processing error:", error);

        try {
          port.postMessage({
            type: "EMAIL_PROCESSED",
            payload: { error: String(error) }
          });
        } catch (e) {
          console.error("Could not send response:", e);
        }
      }
    });

    port.onDisconnect.addListener(() => {
      console.log("Email processing connection disconnected");
    });
  });
});

async function sendToAPI(
    subject: string,
    sender: string,
    text: string,
    urls: string[],
    emails: string[],
    hyperlinks: string[]
) {
  const response = await fetch("http://localhost:8000/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject,
      sender,
      text,
      urls,
      emails,
      links: hyperlinks
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}
