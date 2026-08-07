require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { ethers } = require("ethers");

const abi = require("./abi");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    provider
);

app.get("/", (req,res)=>{
    res.send("Prophixy Verify API Running");
});

app.get("/verify/:wallet", async (req,res)=>{

    try{

        const wallet = req.params.wallet;

        if(!ethers.isAddress(wallet)){

            return res.json({
                success:false,
                message:"Invalid wallet"
            });

        }

        const minted = await contract.hasMinted(wallet);

        if(!minted){

            return res.json({

                success:true,

                minted:false

            });

        }

        const role = await contract.getRoleName(wallet);
const axios = require("axios");
await axios.post("https://YOUR-DISCORD-BOT.onrender.com/assign-role", {
  guildId: process.env.GUILD_ID,
  userId: tokenData.discordId,
  roleName: role
});
        return res.json({

            success:true,

            minted:true,

            role

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            error:err.message

        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{

    console.log("Verify API running on port",PORT);

});
