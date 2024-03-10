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
import * as leaderboard from "./leaderboard";

export const commands: NamedCommand = {
    balance,
    bet,
    bets,
    betadm,
    championships,
    help,
    leaderboard,
    match,
    matches,
    redeploy,
};
