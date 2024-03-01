import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("redeploy")
    .setDescription("Reinstalls / updates commands for the guild.");


export async function execute(interaction: CommandInteraction) {
    return await interaction.reply({ephemeral: true, content: "And who the F are you?"});
}
