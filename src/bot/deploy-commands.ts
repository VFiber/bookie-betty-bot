import { Guild, REST, Routes } from "discord.js";
import { botConfig } from "./botConfig";
import { commands } from "../commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({version: "10"}).setToken(botConfig.DISCORD_TOKEN);

type DeployCommandsProps = {
    guildId: string;
};


export async function redeployGuildCommands(guild: Guild) {
    await rest.put(Routes.applicationGuildCommands(botConfig.DISCORD_CLIENT_ID, guild.id), {body: []})
        .then(() => console.log('Successfully deleted all guild commands.'))
        .catch(console.error);

    await deployCommands({guildId: guild.id});
}

export async function deployCommands({guildId}: DeployCommandsProps) {
    try {
        console.log("Started refreshing application (/) commands.", Object.getOwnPropertyNames(commands));

        await rest.put(
            Routes.applicationGuildCommands(botConfig.DISCORD_CLIENT_ID, guildId),
            {
                body: commandsData
            }
        );

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

export async function checkCommandDeployment(guild: Guild) {
    console.log('Checking command deployment on ', guild.name, guild.id);
    const commands = await rest.get(Routes.applicationGuildCommands(botConfig.DISCORD_CLIENT_ID, guild.id));

    if (!commands || (Array.isArray(commands) && commands.filter((command) => command.name === 'redeploy').length === 0)) {
        // redeploy command not found, redeploying all commands, just to be sure
        await deployCommands({guildId: guild.id});
    }
}
