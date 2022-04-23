const { SlashCommandBuilder } = require('@discordjs/builders');

const command = new SlashCommandBuilder()
    .setName('fetch')
    .setDescription('Fetches a sandbox.')
    .addStringOption(option =>
        option.setName('id')
        .setDescription('The ID of the Sandbox.')
        .setRequired(true));

module.exports = command;