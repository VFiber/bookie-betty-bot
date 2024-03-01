import { NamedCommand } from '../bot';
import * as matches from "./matches";
import * as redeploy from "./redeploy";
import * as help from "./help";
import * as match from "./match";
import * as matchadmin from "./matchadmin";
import * as balance from "./balance";

export const commands: NamedCommand = {
    balance,
    help,
    match,
    matches,
    matchadmin,
    redeploy
};
