import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the available commands for the bot.");

export async function execute(interaction: CommandInteraction) {
    console.log(interaction);
    return interaction.reply("I am in Zen mode, still discovering myself... don't ask Fiber.");
}
