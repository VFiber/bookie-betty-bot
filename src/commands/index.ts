import { NamedCommand } from '../bot';
import * as matches from "./matches";
import * as redeploy from "./redeploy";
import * as help from "./help";
import * as match from "./match";
import * as betadm from "./betadm";
import * as balance from "./balance";
import * as championships from "./championships";
import * as bet from "./bet";
import * as bets from "./bets";

export const commands: NamedCommand = {
    bet,
    bets,
    balance,
    help,
    match,
    matches,
    betadm,
    redeploy,
    championships
};
