chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "LAUNCH_AUTOMATION") {
    sendResponse({ status: "processing_initialized" });
    startLocalScrapingCycle();
  }
});

async function startLocalScrapingCycle() {
  const localStorage = await chrome.storage.local.get("userCredentials");
  if (!localStorage.userCredentials || !localStorage.userCredentials.email) {
    console.error("Authorization Error: Missing active user registration details.");
    return;
  }

  // Parses the native Naukri job target listing tuple containers on screen
  const targetJobElements = document.querySelectorAll('.srp-job-tuple');
  
  for (let jobContainer of targetJobElements) {
    const rawJobText = jobContainer.innerText;

    try {
      // 🛡️ HARD SERVER LICENSE CHECK: Passes token data to Render for verification
      const apiResponse = await fetch('https://onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localStorage.userCredentials.email,
          expected_ctc: localStorage.userCredentials.ctc,
          notice_period_days: parseInt(localStorage.userCredentials.notice),
          resume_summary: localStorage.userCredentials.resume,
          job_text: rawJobText
        })
      });

      // If the cloud server reveals that they are a free user or bypassed the gate, kill execution
      if (apiResponse.status === 403) {
        console.error("Security Alert: Active premium transaction license required. Halting bot.");
        jobContainer.style.border = "3px solid #f43f5e"; // Highlight blocked cards in red
        break; 
      }

      const backendResult = await apiResponse.json();
      if (backendResult.status === "Queued") {
        jobContainer.style.border = "3px solid #10b981"; // Highlight approved matches in green
        console.log("Task authorized successfully. Appended to background runner arrays.");
      }
    } catch (networkError) {
      console.error("Infrastructure connection offline: ", networkError);
    }
    
    // Human-mirroring cooldown jitter delay to beat tracking algorithms seamlessly
    await new Promise(resolve => setTimeout(resolve, 6000));
  }
}
