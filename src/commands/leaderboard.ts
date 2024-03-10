import { codeBlock, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getBetApi } from '../bot';
import { MessageFormatter } from '../bet';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Displays the best betters.");

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const gamblers = await betApi.getTopBetters();

    return interaction.editReply(codeBlock(MessageFormatter.createLeaderboard(gamblers)));
}
