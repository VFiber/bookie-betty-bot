import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { botConfig, getBetApi } from '../bot';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Gets your balance.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;
    const userName = user.username;

    const gambler = await betApi.getGambler(userName);

    if (!gambler) {
        return interaction.reply({
                content: `Még nálam nem vagy regisztrálva, de az első fogadásodnál automatikusan létrejön számodra egy számla $${botConfig.DEFAULT_GAMBLING_AMOUNT} egyenleggel, úgyhogy tedd meg tétjeid és lesz!`,
                ephemeral: true
            }
        );
    }

    return interaction.reply({
        content: `Az egyenleged: $${gambler.balance}.`,
        ephemeral: true
    });
}
