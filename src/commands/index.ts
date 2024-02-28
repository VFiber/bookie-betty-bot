import { NamedCommand } from '../bot-types';
import * as matches from "./matches";
import * as redeploy from "./redeploy";
import * as help from "./help";
import * as match from "./match";
import * as matchadmin from "./matchadmin";


export const commands: NamedCommand = {
    help,
    match,
    matches,
    matchadmin,
    redeploy
};
