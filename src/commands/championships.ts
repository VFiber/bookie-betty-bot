import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getBetApi } from '../bot';
import { MessageFormatter } from '../bet';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('championships')
    .setDescription('Displays the championships.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const championshipWithIds = await betApi.getChampionships();

    if (!championshipWithIds || championshipWithIds.length === 0) {
        return interaction.reply({
                content: `Nincsenek még bajnokságok, adminisztrátorok hozhatnak létre újakat a /betadm championship create <bajnkoság neve> parancs segítségével.`
            }
        );
    }

    return interaction.reply(MessageFormatter.createChampionshipListReply(championshipWithIds));
}
