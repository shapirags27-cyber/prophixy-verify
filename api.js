const express = require("express");

module.exports = (client) => {
  const app = express();

  app.use(express.json());

  app.post("/assign-role", async (req, res) => {
    try {
      const { guildId, userId, roleName } = req.body;

      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);

      const role = guild.roles.cache.find(
        r => r.name.toLowerCase() === roleName.toLowerCase()
      );

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found"
        });
      }

      await member.roles.add(role);

      res.json({
        success: true
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Discord API listening on port ${PORT}`);
});
};
