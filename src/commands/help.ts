import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the available commands for the bot.");

export async function execute(interaction: CommandInteraction) {
    //implemented in index.ts
}
