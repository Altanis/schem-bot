require('dotenv/config');

const { Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const Enmap = require('enmap');
const moment = require('dayjs');

const client = new Client({ intents: 32767 });
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

const sandboxes = new Enmap({ name: 'sandboxes' });

const IDS = {
    Channel: '967166195067400242',
    Mention: '967166280878653530',
    Abuser: '967166321181720606',
    Client: '967122082745954415',
    Guild: '967165577292574721',
    Staff: '967166400051421344',
    Owner: '765239557666111509',
}

const commands = [];
const files = require('fs').readdirSync('./commands/').filter(f => f.endsWith('js'));

for (let file of files) {
    commands.push(require(`./commands/${file}`).toJSON());
}

client.login(process.env.TOKEN);

client.on('ready', function() {
    console.log('Bot is online.');
    this.user.setActivity({ name: 'over Diep.io', type: 'PLAYING' });

    rest.put(Routes.applicationGuildCommands(IDS.Client, IDS.Guild), {
        body: commands,
    })
    .then(() => { console.log('Successfully started all slash (/) commands.'); })
    .catch((error) => { console.log(`Failed to start all slash (/) commands. Error: ${error}`) });
});

client.on('error', console.error);

client.on('interactionCreate', function(interaction) {
    if (interaction.isCommand()) {
        switch (interaction.commandName) {
            case 'createsbx': {
                if (interaction.member.roles.cache.has(IDS.Abuser)) return interaction.reply({ content: 'You cannot create sandboxes, as you are an abuser.',  ephemeral: true });

                const region = interaction.options.getString('region');
                const players = interaction.options.getNumber('players') || 25;
                const notes = interaction.options.getString('notes') || 'No notes.';
                let link = interaction.options.getString('link');

                link = link.startsWith('https://') ? link : `https://${link}`;
                if (!link.includes('diep.io/#') || link.length < 90 || link.length > 110) return interaction.reply({ content: 'Invalid link.', ephemeral: true });

                const embed = new MessageEmbed()
                    .setTitle('New Sandbox')
                    .setDescription(`Hosted by: **${interaction.user.tag}**.`)
                    .addField('Region', region, true)
                    .addField('Max Players', players.toString(), true)
                    .addField('Notes', notes, true)
                    .addField('Players (1)', `${interaction.user}`, true)
                    .setTimestamp();
                const button = new MessageActionRow()
                    .addComponents(new MessageButton().setCustomId('join').setLabel('Join').setStyle('SUCCESS'));

                interaction.guild.channels.cache.get(IDS.Channel).send({ content: `<@&${IDS.Mention}>`, embeds: [embed], components: [button] })
                .then(m => {
                    sandboxes.set(m.id, { 
                        info: embed.toJSON(),
                        link,
                        players: [{
                            id: interaction.user.id,
                            time: moment().format('hh:mm:ss, MM/DD/YYYY'),
                        }],
                    });
                    interaction.reply({ content: 'The sandbox was created.', ephemeral: true });
                });

                break;
            }
            case 'fetch': {
                const id = interaction.options.getString('id');

                if (!interaction.member.roles.cache.has(IDS.Staff) && interaction.user.id != IDS.Owner) return interaction.reply({ content: 'I think they\'re onto us...' });
                if (!sandboxes.get(id)) return interaction.reply({ content: 'Invalid ID.', ephemeral: true, });

                const sandbox = sandboxes.get(id);
                const embed = new MessageEmbed().setTitle(`Sandbox ID ${id}`);
                let description = '';

                sandbox.players.forEach((player) => {
                    description += `<@${player.id}> | Joined at **${player.time}** EST\n`;
                });

                embed.setDescription(description);
                embed.addField('Region', sandbox.info.fields[0].value, true);
                embed.addField('Max Players', sandbox.info.fields[1].value, true);
                embed.addField('Notes', sandbox.info.fields[2].value, true);
                embed.addField('Link', sandbox.link, true);
                embed.setTimestamp();

                interaction.reply({ embeds: [embed] });
            }
        }
    } else if (interaction.isButton()) {
        const sandbox = sandboxes.get(interaction.message.id);
    
        if (!sandbox) return interaction.reply({ content: 'Interal issues. Could not find specified sandbox.', ephemeral: true });
        if (interaction.member.roles.cache.has(IDS.Abuser)) return interaction.reply({ content: 'You cannot join this sandbox, as you are an abuser.', ephemeral: true });
        if (sandbox.players.length >= parseInt(sandbox.info.fields[1].value)) return interaction.reply({ content: 'Limit for players has been reached.', ephemeral: true });
        
        let pass = true;
        sandbox.players.forEach(player => {
            if (player.id == interaction.user.id) return pass = false;
        });

        if (!pass) return interaction.reply({ content: 'You already joined the sandbox.', ephemeral: true, });

        const embed = new MessageEmbed()
            .setTitle('Sandbox Link')
            .addField('Link', sandbox.link)
            .setTimestamp();
        interaction.user.send({ embeds: [embed] });
        
        sandbox.players.push({
            id: interaction.user.id,
            time: moment().format('hh:mm:ss, MM/DD/YYYY'),
        });
        
        sandbox.info.fields[3].name = `Players (${sandbox.players.length})`;
        sandbox.info.fields[3].value += `\n${interaction.user}`;
            
        interaction.message.edit({ embeds: [new MessageEmbed(sandbox.info)] });

        sandboxes.set(interaction.message.id, {
            info: sandbox.info,
            link: sandbox.link,
            players: sandbox.players,
        });

        interaction.reply({ content: 'The link has been sent to your DMs.', ephemeral: true });
    }
});
