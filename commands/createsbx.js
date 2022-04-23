const { SlashCommandBuilder } = require('@discordjs/builders');

const command = new SlashCommandBuilder()
    .setName('createsbx')
    .setDescription('Creates a sandbox.')
    .addStringOption(option => 
        option.setName('region')
        .setDescription('The region of this sandbox.')
        .addChoice('San Francisco', 'San Francisco')
        .addChoice('Atlanta', 'Atlanta')
        .addChoice('Frankfurt', 'Frankfurt')
        .addChoice('Sydney', 'Sydney')
        .addChoice('Tokyo', 'Tokyo')
        .setRequired(true))
    .addStringOption(option =>
        option.setName('link')
        .setDescription('The link for the sandbox.')
        .setRequired(true))
    .addNumberOption(option =>
        option.setName('players')
        .setDescription('The maximum amount of players allowed.'))
    .addStringOption(option =>
        option.setName('notes')
        .setDescription('Any extra notes to let players know about.'));

module.exports = command;