# Bookie Betty

Bookie Betty is a simple gambling bot for Discord.

It is written in Typescript and currently in development, and may not be stable. 
Strings are not translated to english, for now its up to you to localize.


## Features
You can (v0.5.0):
- Create a championship with a list of teams
- Create a match between two teams (teams must be in the championship)
- Lists matches
- Bet on a match
- Lock the match on a given times (removes every bet placed after the lock time, punishing late betters)
- Set the result of a match, and the bot will automatically distribute the money to the winners
- Shows your balance

## Gambling system

You can bet on a match winner / draw. Since it does not have odds, your bet goes against others who bet on the opposite result.
The bot might take a percentage of the total bet as a fee, and the rest will be distributed to the winners.

E.g.: 
- Match 1, you bet on Team A victory with $100
- Match 1, 2 another user bets on Team B victory with $25 - $75
- Noone bets for draw
- Admin sets the result of the match as Team B victory
- Without bot fee, the winners would get your 100, plus their bets, so 200 in total. 
- The distribution is proportional to the bet, so the user who bet $25 would get an additional $25 (because 25% of the bets was 25$, he gets 25% of the winnings as well), and the other user would get $75, because of its 75%.

## Setup

> For now, the bot does not have a release-build, so you need to clone the repository and build it yourself.

You need to have Node.js (20.x LTS at least) installed, and a Discord bot token.
Create a copy of the file .env.dist and rename it to .env, then fill the token field with your bot token.

- [Create a Discord bot shell](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) for the script
    - Generate a token and copy it to the .env file in the `DISCORD_TOKEN` field
    - Add the client id to the .env file in the `DISCORD_CLIENT_ID` field
- [Add the bot to your server](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)
- Check the .env file and fill according to your needs (default championship ID, default balance, SQL, persistence, test, etc.)
- Run `npm install` to install the dependencies
- Run `npm run build` to build the bot (in a 'dist' folder)
- Run `npm run start` to start the bot, it should connect to the server and be ready to use


## Permission system
> By default the bot will allow everyone to use any command.
 
You can limit command availability for your bot to a certain role in Server settings -> Apps -> Integrations -> Bot name. 
My recommendation is to create a role called "Bet Admin" or something similar and restrict the admin commands to this role.

## Usage
First, create a championship and set the default championship ID in the .env file. 
Then, you can create matches and bet on them.
