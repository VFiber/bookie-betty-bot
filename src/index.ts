import { Client, Events } from "discord.js";
import { deployCommands } from './deploy-commands';
import { commands } from './commands';
import { config } from './config';

const {REST, Routes} = require('discord.js');

const rest = new REST().setToken(config.DISCORD_TOKEN);

const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages"]
});

client.once("ready", async () => {
    console.log("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
    console.log("Joined a new guild! Deploying commands...");
    await deployCommands({guildId: guild.id});
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const {commandName} = interaction;
    if (commands[commandName as keyof typeof commands]) {
        commands[commandName as keyof typeof commands].execute(interaction);
    }
});


client.on(Events.GuildAvailable, async (guild) => {
    console.log("Guild is available! ReDeploying commands...");
    console.log(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guild.id));
    await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guild.id), {body: []})
        .then(() => console.log('Successfully deleted all guild commands.'))
        .catch(console.error);

    await deployCommands({guildId: guild.id});
});

client.on(Events.Error, (error) => {
    console.error("An error occurred:", error);
});

client.login(config.DISCORD_TOKEN);


