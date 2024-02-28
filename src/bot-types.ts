import { AutocompleteInteraction, ChatInputCommandInteraction, InteractionResponse, Message } from 'discord.js';


export interface AutocompleteOption {
    name: string,
    value: string | number
}

export type AutoCompleteFn = (i: AutocompleteInteraction) => Promise<AutocompleteOption[] | false>;

export interface ParameterAutocompleteMap {
    [key: string]: AutoCompleteFn;
}

export interface Command {
    data: any;
    execute: (i: ChatInputCommandInteraction) => Promise<InteractionResponse> | Promise<Message> | Promise<void>;
    autocompleteMap?: ParameterAutocompleteMap;
}

export interface NamedCommand {
    [key: string]: Command;
}



