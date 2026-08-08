const params = new URLSearchParams(window.location.search);
const discordId = params.get("discordId");

const connectButton = document.getElementById("connectButton");
const status = document.getElementById("status");

async function connectWallet() {
  try {
    if (!window.ethereum) {
      status.innerText = "❌ No wallet found. Please open this page in a wallet browser.";
      return;
    }

    status.innerText = "Connecting wallet...";

    const provider = new ethers.BrowserProvider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const wallet = await signer.getAddress();

    status.innerText = "Checking wallet...";

    if (!discordId) {
      status.innerText = "❌ Please login with Discord first.";

      setTimeout(() => {
        window.location.href = "/auth/discord";
      }, 1000);

      return;
    }

    await verifyWallet(wallet);

  } catch (error) {
    console.error(error);

    status.innerText = "❌ Wallet connection failed.";
  }
}

async function verifyWallet(wallet) {
  try {
    status.innerText = "🔎 Verifying your Prophixy SBT...";

    const response = await fetch(
      `/verify/${encodeURIComponent(wallet)}?discordId=${encodeURIComponent(discordId)}`
    );

    const data = await response.json();

    console.log("Verification result:", data);

    if (data.success && data.minted) {

      status.innerText =
        `✅ Verified — ${data.role}`;

      alert(
        `✅ Verification successful!\n\nYour Prophixy SBT was found.\nRole: ${data.role}`
      );

    } else if (data.success && !data.minted) {

      status.innerText =
        "❌ No Prophixy SBT found.";

      alert(
        "❌ This wallet does not have a Prophixy SBT."
      );

    } else {

      status.innerText =
        "❌ Verification failed.";

      alert(
        data.message ||
        data.error ||
        "Verification failed."
      );
    }

  } catch (error) {

    console.error("Verification error:", error);

    status.innerText =
      "❌ Could not connect to verification server.";
  }
}

connectButton.addEventListener("click", connectWallet);
