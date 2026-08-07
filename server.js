require("dotenv").config();

const abi = require("./abi/ProphixySBT.json");

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  provider
);
const { ethers } = require("ethers");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Prophixy Verify"
  });

app.post("/verify", async (req, res) => {

  try {

    const {
      discordId,
      wallet,
      signature
    } = req.body;

    const message =
      "Verify my Prophixy Discord account";

    const recovered =
      ethers.verifyMessage(
        message,
        signature
      );
const balance = await contract.balanceOf(wallet);

if (balance == 0n) {

  return res.json({

    success: false,

    message: "No Prophixy SBT found."

const role = Number(
  await contract.getRole(wallet)
);

let roleName = "None";

switch (role) {

  case 1:
    roleName = "Top Forecaster";
    break;

  case 2:
    roleName = "Market Creator";
    break;

}

res.json({

  success: true,

  role: roleName,

  wallet,

  message: "Verification successful"

  });

}

    if (
      recovered.toLowerCase() !==
      wallet.toLowerCase()
    ) {

      return res.json({

        success:false,

        message:"Invalid signature"

      });

    }

    console.log("Discord:", discordId);

    console.log("Wallet:", wallet);

    res.json({

      success:true,

      message:"Wallet verified successfully"

    });

  }

  catch(err){

    console.log(err);

    res.json({

      success:false,

      message:"Verification failed"

    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Verify server running on port ${PORT}`);
});
