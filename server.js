require("dotenv").config();

const { ethers } = require("ethers");
const express = require("express");
const cors = require("cors");
const path = require("path");

const abi = require("./abi/ProphixySBT.json");

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  provider
);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================================
// HEALTH
// ================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Prophixy Verify"
  });
});

// ================================
// VERIFY WALLET
// ================================

app.post("/verify", async (req, res) => {
  try {
    const {
      discordId,
      wallet,
      signature
    } = req.body;

    if (!discordId || !wallet || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Discord ID, wallet, or signature."
      });
    }

    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address."
      });
    }

    // ----------------------------
    // Verify wallet signature
    // ----------------------------

    const message =
      "Verify my Prophixy Discord account";

    const recovered = ethers.verifyMessage(
      message,
      signature
    );

    if (
      recovered.toLowerCase() !==
      wallet.toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid wallet signature."
      });
    }

    // ----------------------------
    // Check SBT
    // ----------------------------

    const balance = await contract.balanceOf(wallet);

    if (balance < 1n) {
      return res.json({
        success: false,
        minted: false,
        message: "No Prophixy SBT found."
      });
    }

    // ----------------------------
    // Get SBT role
    // ----------------------------

    const roleId = Number(
      await contract.getRole(wallet)
    );

    let roleName = "None";

    if (roleId === 1) {
      roleName = "Top Forecaster";
    } else if (roleId === 2) {
      roleName = "Market Creator";
    }

    console.log("Discord:", discordId);
    console.log("Wallet:", wallet);
    console.log("SBT role:", roleName);

    // ----------------------------
    // Success
    // ----------------------------

    return res.json({
      success: true,
      minted: true,
      role: roleName,
      roleId,
      wallet,
      message: "Verification successful."
    });

  } catch (err) {
    console.error("Verification error:", err);

    return res.status(500).json({
      success: false,
      message: "Verification failed.",
      error: err.message
    });
  }
});

// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `✅ Prophixy Verify server running on port ${PORT}`
  );
});
