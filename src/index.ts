import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    Events,
    Guild,
    Interaction,
    InteractionType,
    ApplicationCommandOptionType
} from "discord.js";
import { deployCommands, redeployGuildCommands } from './deploy-commands';
import { commands } from './commands';
import { config } from './config';
import { parameterAutocompleteMap } from './global-autocomplete-parameters';
import { AutocompleteOption, ParameterAutocompleteMap } from './bot-types';

const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages"]
});

let myGuild: Guild;

function isCommandInteraction(interaction: Interaction): interaction is ChatInputCommandInteraction {
    return interaction.isCommand();
}

client.once("ready", async () => {
    console.log("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
    console.log("Joined a new guild! Deploying commands...");
    await deployCommands({guildId: guild.id});
});

client.on(Events.InteractionCreate, async (interaction) => {
    console.log(InteractionType[interaction.type]);
    if (!isCommandInteraction(interaction) && !interaction.isAutocomplete()) {
        return;
    }

    if (interaction.isAutocomplete()) {
        return await handleAutocompleteInteraction(interaction);
    }

    const {commandName} = interaction;

    if (commandName === 'redeploy' && myGuild) {
        await interaction.deferReply({ephemeral: true});
        await redeployGuildCommands(myGuild);
        await interaction.editReply({content: "Commands redeployed!"});
        return Promise.resolve();
    }

    if (commands[commandName as keyof typeof commands]) {
        await commands[commandName as keyof typeof commands].execute(interaction);
    }
});

/**
 * Megkeresi, hogy az adott paraméterhez van-e autocomplete
 * @param interaction
 */
async function handleAutocompleteInteraction(interaction: AutocompleteInteraction) {
    // első körön megkeressük, hogy a parancshoz van-e autocomplete és az adott paraméterhez van-e
    const {commandName} = interaction;
    const commandKey = commandName as keyof typeof commands;
    const command = commands[commandKey];

    const focused = interaction.options.getFocused(true);

    if (!focused) {
        return interaction.respond([]);
    }

    console.debug("Autocomplete for: ", commandKey, interaction?.options?.getSubcommand(), focused.name, ApplicationCommandOptionType[focused.type], ` Value: "${focused.value}"`);

    const parameterName = focused.name as keyof ParameterAutocompleteMap;

    let autocompleteResponse: AutocompleteOption[] | false = false;

    if (command &&
        command?.autocompleteMap &&
        command.autocompleteMap[parameterName] &&
        command.autocompleteMap[parameterName] instanceof Function
    ) {
        console.debug("Local autocomplete found");
        autocompleteResponse = await command.autocompleteMap[parameterName](interaction);
    }

    // nincs lokális autocomplete vagy taktikusan nem akarja lekezelni a paramétert, megnézzük van-e globális
    if (autocompleteResponse === false && parameterAutocompleteMap[parameterName]) {
        console.debug("Global autocomplete found");
        autocompleteResponse = await parameterAutocompleteMap[parameterName](interaction);
    }

    if (autocompleteResponse && Array.isArray(autocompleteResponse)) {
        if (autocompleteResponse.length > 25) {
            console.debug("Too many autocomplete options, returning first 25");
            return await interaction.respond(autocompleteResponse.slice(0, 25));
        }
        console.debug("Options: ", autocompleteResponse);
        return await interaction.respond(autocompleteResponse);
    }

    console.debug("No autocomplete options found.");
    return await interaction.respond([]);
}

client.on(Events.GuildAvailable, async (guild) => {
    console.log("Guild is available!");
    myGuild = guild;
});

client.on(Events.Error, (error) => {
    console.error("An error occurred:", error);
});

client.login(config.DISCORD_TOKEN);


