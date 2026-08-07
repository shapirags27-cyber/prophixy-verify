const button = document.getElementById("connectButton");
const status = document.getElementById("status");

button.onclick = async () => {
  try {
    if (!window.ethereum) {
      status.innerHTML = "❌ MetaMask or a compatible wallet is not installed.";
      return;
    }

    status.innerHTML = "🔄 Connecting wallet...";

    const provider = new ethers.BrowserProvider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    const wallet = await signer.getAddress();

    status.innerHTML = "✅ Wallet Connected<br><br>" + wallet;

    const response = await fetch(`/verify/${wallet}`);

    const data = await response.json();

    if (!data.success) {
      status.innerHTML = "❌ Verification failed.";
      return;
    }

    if (!data.minted) {
      status.innerHTML =
        "❌ No Prophixy SBT found.<br><br>Please mint your SBT first.";
      return;
    }

    status.innerHTML = `
      ✅ Wallet Verified<br><br>
      👛 ${wallet}<br><br>
      🎖 Role: <b>${data.role}</b><br><br>
      You can now return to Discord.
    `;

  } catch (err) {
    console.error(err);
    status.innerHTML = "❌ " + err.message;
  }
};
