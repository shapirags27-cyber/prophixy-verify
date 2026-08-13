let discordUser = null;

// ================================
// CHECK DISCORD SESSION
// ================================

async function checkDiscordSession() {

    try {

        const response = await fetch("/session", {
            credentials: "include"
        });

        const data = await response.json();

        if (!data.loggedIn) {

            discordUser = null;

            updateStatus(
                "Please login with Discord first."
            );

            return false;
        }

        discordUser = data;

        updateStatus(
            `Discord connected: ${data.username}`
        );

        return true;

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        updateStatus(
            "Could not check Discord login."
        );

        return false;
    }
}

// ================================
// STATUS
// ================================

function updateStatus(message) {

    const status =
        document.getElementById("status");

    if (status) {
        status.textContent = message;
    }
}

// ================================
// VERIFY WALLET
// ================================

async function verifyWallet(wallet) {

    // Make sure Discord is logged in
    const loggedIn =
        await checkDiscordSession();

    if (!loggedIn) {

        alert(
            "Please login with Discord first."
        );

        window.location.href =
            "/auth/discord";

        return;
    }

    try {

        updateStatus(
            "Checking your Prophixy SBT..."
        );

        const response =
            await fetch(
                `/verify/${encodeURIComponent(wallet)}`,
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        console.log(
            "Verification result:",
            data
        );

        if (
            data.success &&
            data.minted
        ) {

            updateStatus(
                `Verified! Role: ${data.role}`
            );

            alert(
                `Verified! Role: ${data.role}`
            );

        } else if (
            data.success &&
            !data.minted
        ) {

            updateStatus(
                "This wallet does not have a Prophixy SBT."
            );

            alert(
                "This wallet does not have a Prophixy SBT."
            );

        } else {

            updateStatus(
                data.message ||
                "Verification failed."
            );

            alert(
                data.message ||
                "Verification failed."
            );
        }

    } catch (error) {

        console.error(
            "Verification error:",
            error
        );

        updateStatus(
            "Could not connect to the verification server."
        );

        alert(
            "Could not connect to the verification server."
        );
    }
}

// ================================
// CONNECT WALLET
// ================================

async function connectWallet() {

    if (!window.ethereum) {

        alert(
            "Please install or open a wallet such as MetaMask or Phantom."
        );

        return;
    }

    try {

        updateStatus(
            "Connecting wallet..."
        );

        const accounts =
            await window.ethereum.request({
                method: "eth_requestAccounts"
            });

        if (!accounts || !accounts.length) {

            updateStatus(
                "No wallet connected."
            );

            return;
        }

        const wallet =
            accounts[0];

        console.log(
            "Connected wallet:",
            wallet
        );

        await verifyWallet(wallet);

    } catch (error) {

        console.error(
            "Wallet connection error:",
            error
        );

        updateStatus(
            "Wallet connection failed."
        );
    }
}

// ================================
// PAGE START
// ================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await checkDiscordSession();

        const button =
            document.getElementById(
                "connectButton"
            );

        if (button) {

            button.addEventListener(
                "click",
                connectWallet
            );
        }
    }
);
