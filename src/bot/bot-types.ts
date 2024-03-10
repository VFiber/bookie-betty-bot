import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    InteractionResponse,
    Message,
    SlashCommandBuilder
} from 'discord.js';


export interface AutocompleteOption {
    name: string,
    value: string | number
}

export type AutoCompleteFn = (i: AutocompleteInteraction) => Promise<AutocompleteOption[] | false>;

export interface ParameterAutocompleteMap {
    [key: string]: AutoCompleteFn;
}

export interface Command {
    data: Partial<SlashCommandBuilder>;
    execute: (i: ChatInputCommandInteraction) => Promise<InteractionResponse | Message | void>;
    autocompleteMap?: ParameterAutocompleteMap;
}

export interface NamedCommand {
    [key: string]: Command;
}



