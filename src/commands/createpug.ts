import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('createpug')
    .setDescription('Replies with your input!')
    .addStringOption(option =>
        option.setName('input')
            .setDescription('The input to echo back'))
    .addBooleanOption(option =>
        option.setName('ephemeral')
            .setDescription('Whether or not the echo should be ephemeral'));

export async function execute(interaction: ChatInputCommandInteraction) {
    console.log(interaction.options.getString('input'), interaction.options.getBoolean('ephemeral'));
    return interaction.reply({
        content: interaction.options.getString('input') || 'No input provided!',
        ephemeral: interaction.options.getBoolean('ephemeral') || false
    });
}
