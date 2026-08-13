require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const { ethers } = require("ethers");

const abi = require("./abi");

const app = express();
app.set("trust proxy", 1);

// ================================
// MIDDLEWARE
// ================================

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "prophixy-development-secret",

        resave: false,

        saveUninitialized: false,

      cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
}
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// ================================
// CONFIG
// ================================

const PORT =
    process.env.PORT || 3000;

const provider =
    new ethers.JsonRpcProvider(
        process.env.RPC_URL
    );

const contract =
    new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        abi,
        provider
    );

// ================================
// HOME
// ================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

// ================================
// DISCORD LOGIN
// ================================

app.get("/auth/discord", (req, res) => {

    const params =
        new URLSearchParams({
            client_id:
                process.env.DISCORD_CLIENT_ID,

            redirect_uri:
                process.env.DISCORD_REDIRECT_URI,

            response_type: "code",

            scope: "identify"
        });

    res.redirect(
        `https://discord.com/oauth2/authorize?${params.toString()}`
    );
});

// ================================
// DISCORD CALLBACK
// ================================

app.get(
    "/auth/discord/callback",
    async (req, res) => {

        const code = req.query.code;

        if (!code) {

            return res.status(400).send(
                "Missing Discord authorization code."
            );
        }

        try {

            // ----------------------------
            // Exchange code for token
            // ----------------------------

            const tokenResponse =
                await axios.post(
                    "https://discord.com/api/oauth2/token",

                    new URLSearchParams({
                        client_id:
                            process.env.DISCORD_CLIENT_ID,

                        client_secret:
                            process.env.DISCORD_CLIENT_SECRET,

                        grant_type:
                            "authorization_code",

                        code,

                        redirect_uri:
                            process.env.DISCORD_REDIRECT_URI
                    }).toString(),

                    {
                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        }
                    }
                );

            const accessToken =
                tokenResponse.data.access_token;

            // ----------------------------
            // Get Discord user
            // ----------------------------

            const userResponse =
                await axios.get(
                    "https://discord.com/api/users/@me",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`
                        }
                    }
                );

            const discordUser =
                userResponse.data;

            console.log(
                "Discord login:",
                discordUser.username,
                discordUser.id
            );

            // ----------------------------
            // Save Discord identity
            // ----------------------------

            req.session.discordId =
                discordUser.id;

            req.session.username =
                discordUser.username;

            req.session.save((err) => {

                if (err) {

                    console.error(
                        "Session save error:",
                        err
                    );

                    return res.status(500).send(
                        "Could not save Discord session."
                    );
                }

                console.log(
                    "Discord session saved:",
                    discordUser.username,
                    discordUser.id
                );

               res.redirect(
    "/"
);
            });

        } catch (error) {

            console.error(
                "Discord OAuth error:",
                error.response?.data ||
                error.message
            );

            res.status(500).send(
                "Discord login failed."
            );
        }
    }
);

// ================================
// DISCORD SESSION
// ================================

app.get("/session", (req, res) => {

    if (!req.session.discordId) {

        return res.json({
            loggedIn: false
        });
    }

    res.json({
        loggedIn: true,

        discordId:
            req.session.discordId,

        username:
            req.session.username
    });
});

// ================================
// LOGOUT
// ================================

app.get("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.error(
                "Logout error:",
                err
            );

            return res.status(500).json({
                success: false
            });
        }

        res.json({
            success: true
        });
    });
});

// ================================
// VERIFY SBT
// ================================

app.get(
    "/verify/:wallet",
    async (req, res) => {

        try {

            const wallet =
                req.params.wallet;

            // ----------------------------
            // Validate wallet
            // ----------------------------

            if (!ethers.isAddress(wallet)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid wallet address"
                });
            }

            // ----------------------------
            // Get Discord from session
            // ----------------------------

            const discordId =
                req.session.discordId;

            if (!discordId) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Discord login required"
                });
            }

            console.log(
                "Checking wallet:",
                wallet
            );

            console.log(
                "Discord user:",
                discordId
            );

            // ----------------------------
            // Check SBT
            // ----------------------------

            const minted =
                await contract.hasMinted(
                    wallet
                );

            if (!minted) {

                return res.json({

                    success: true,

                    minted: false,

                    message:
                        "This wallet does not have a Prophixy SBT."
                });
            }

            // ----------------------------
            // Get SBT role
            // ----------------------------

            const role =
                await contract.getRoleName(
                    wallet
                );

            console.log(
                "SBT role:",
                role
            );

            // ----------------------------
            // Assign Discord role
            // ----------------------------

            if (
                !process.env.DISCORD_BOT_API
            ) {

                console.error(
                    "DISCORD_BOT_API is not configured."
                );

                return res.status(500).json({
                    success: false,
                    minted: true,
                    role,
                    message:
                        "Discord bot API is not configured."
                });
            }

            try {

                const botResponse =
                    await axios.post(

                        `${process.env.DISCORD_BOT_API}/assign-role`,

                        {
                            guildId:
                                process.env.GUILD_ID,

                            userId:
                                discordId,

                            roleName:
                                role,

                            wallet:
                                wallet
                        },

                        {
                            headers: {
                                "X-Verify-Secret":
                                    process.env.VERIFY_API_SECRET
                            },
                            timeout: 15000
                        }
                    );

                console.log(
                    "Discord role response:",
                    botResponse.data
                );

            } catch (discordError) {

                console.error(
                    "Discord role assignment failed:",

                    discordError.response?.data ||
                    discordError.message
                );

                return res.status(502).json({

                    success: false,

                    minted: true,

                    role,

                    message:
                        "SBT verified, but Discord role assignment failed."
                });
            }

            // ----------------------------
            // SUCCESS
            // ----------------------------

            return res.json({

                success: true,

                minted: true,

                role,

                message:
                    "SBT verified and Discord role assigned."
            });

        } catch (error) {

            console.error(
                "Verification error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Verification failed."
            });
        }
    }
);

// ================================
// HEALTH CHECK
// ================================

app.get(
    "/health",
    async (req, res) => {

        try {

            const network =
                await provider.getNetwork();

            res.json({

                success: true,

                network:
                    network.name,

                chainId:
                    network.chainId.toString(),

                contract:
                    process.env.CONTRACT_ADDRESS
            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message:
                    error.message
            });
        }
    }
);

// ================================
// START SERVER
// ================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Verify API running on port ${PORT}`
        );

        console.log(
            "Network: Ethereum Sepolia"
        );

        console.log(
            "Contract:",
            process.env.CONTRACT_ADDRESS
        );
    }
);
