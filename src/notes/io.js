/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2020 Open Assessment Technologies SA;
 */

const fs = require('fs-extra');
const path = require('path');
const opn = require('opn');
const inquirer = require('inquirer');
const semver = require('semver');
const concat = require('concat');

const config = require('../config.js')();
const log = require('../log.js');

/**
 * A stateless collection of functions for reading from and writing to files on disk
 */
module.exports = {
    /**
     * Load and initialise release extension config
     * @returns {Object} data
     */
    async loadConfig() {
        log.doing('Loading config');
        let data = Object.assign({}, await config.load());

        // Request github token if necessary
        if (!data.token) {
            setTimeout(() => opn('https://github.com/settings/tokens'), 2000);

            const { inputToken } = await inquirer.prompt({
                type: 'input',
                name: 'token',
                message: 'I need a Github token, with "repo" rights (check your browser) : ',
                validate: token => /[a-z0-9]{32,48}/i.test(token),
                filter: token => token.trim()
            });

            data.token = inputToken;

            await config.write(data);
        }
        return data;
    },

    /**
     * Get 2 composer files from the user
     * @returns {Object}
     */
    async getComposers() {
        const file1 = await this.promptForComposerJson('Path to the starting composer.json');
        const file2 = await this.promptForComposerJson('Path to the ending composer.json');
        return await this.readComposerFiles({ file1, file2 });
    },

    /**
     * Given 2 composer files, check them and convert the dependencies to JS objects
     * @param {Object} files - should contain file1 & file2 paths
     * @returns {Object}
     */
    async readComposerFiles(files) {
        const { file1, file2 } = files;
        const exts1 = await this.readComposerJsonDeps(file1);
        const exts2 = await this.readComposerJsonDeps(file2);
        return { exts1, exts2 };
    },

    /**
     * Prompt the user for a path to a composer.json
     * @param {String} [message='Path?']
     * @param {String} [defaultFile='composer.json']
     * @returns {String} path
     */
    async promptForComposerJson(message = 'Path?', defaultFile = 'composer.json') {
        const { composerJsonPath } = await inquirer.prompt({
            type: 'input',
            name: 'composerJsonPath',
            message,
            default: `${process.cwd()}/${defaultFile}`
        });

        return composerJsonPath;
    },

    /**
     * Read dependencies section from a given composer file on disk
     * @param {String} composerJsonPath
     * @returns {Object} composer dependencies
     */
    async readComposerJsonDeps(composerJsonPath) {
        try {
            const fileData = await fs.readJson(composerJsonPath, 'utf-8');
            return fileData.require;
        }
        catch (err) {
            log.error(err);
            log.exit('Error occured while reading file.');
        }
    },

    /**
     * Write a file with change log
     * @param {String} repoName
     * @param {String} outputDir
     * @param {Array} releaseNotes
     */
    async writeChangeLog(repoName, outputDir, releaseNotes) {
        repoName = repoName.replace('/', '_');
        const suffix = '_release_notes.md';
        log.doing(`Writing change log to ${repoName}${suffix}`);

        const file = fs.createWriteStream(`${outputDir}/${repoName}${suffix}`);
        file.on('error', (err) => {
            log.error(`Error writing file: ${err}`);
        });

        // Begin writing Markdown
        file.write(`# ${repoName}\n`);

        releaseNotes.forEach((note) => {
            if (note && note.version && semver.valid(semver.coerce(note.version)) && note.releaseNotes) {
                file.write(`\n## ${note.version}\n`);
                file.write(`\n${note.releaseNotes}`);
            }
        });
        file.end();
    },

    /**
     * Concatenates all the files in one directory. Writes result to the same location
     * @param {String} directory - path to both the input and output files
     * @param {String} outputFile - filename to write to
     */
    concatAllFiles(directory, outputFile) {
        log.doing(`Concatenating all release notes to ${directory}/${outputFile}`);
        fs.readdir(directory, function(err, items) {
            concat(
                items.map(filename => path.join(directory, filename)),
                path.join(directory, outputFile)
            );
        });
    }
};
