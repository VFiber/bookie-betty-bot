import { Guild, REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({version: "10"}).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
    guildId: string;
};


export async function redeployGuildCommands(guild: Guild) {
    await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guild.id), {body: []})
        .then(() => console.log('Successfully deleted all guild commands.'))
        .catch(console.error);

    await deployCommands({guildId: guild.id});
}

export async function deployCommands({guildId}: DeployCommandsProps) {
    try {
        console.log("Started refreshing application (/) commands.", Object.getOwnPropertyNames(commands));

        await rest.put(
            Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
            {
                body: commandsData
            }
        );

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}
