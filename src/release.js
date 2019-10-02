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
 * Copyright (c) 2019 Open Assessment Technologies SA;
 */

/**
 * This module contains methods to release a TAO extension.
 *
 * @author Anton Tsymuk <anton@taotesting.com>
 * @author Ricardo Proenca <ricardo@taotesting.com>
 */

const inquirer = require('inquirer');
const opn = require('opn');
const path = require('path');
const semver = require('semver');
const fs = require('fs');

const config = require('./config.js')();
const github = require('./github.js');
const log = require('./log.js');
const taoInstanceFactory = require('./taoInstance.js');

const getPrData = async (githubClient, validPr) => {
    return await Promise.all(validPr.map(async (prData) => {
        const version = semver.valid(semver.coerce(prData.title));
        const releaseNotes = await githubClient.extractReleaseNotesFromReleasePR(prData.number);
        if (version && releaseNotes) {
            return { version, releaseNotes };
        }
    }));
};

/**
 * Get the taoExtensionRelease
 *
 * @param {String} baseBranch - branch to release from
 * @param {String} branchPrefix - releasing branch prefix
 * @param {String} origin - git repository origin
 * @param {String} releaseBranch - branch to release to
 * @param {String} wwwUser - name of the www user
 * @return {Object} - instance of taoExtensionRelease
 */
module.exports = function taoExtensionReleaseFactory(baseBranch, branchPrefix, origin, releaseBranch, wwwUser) {
    let data = {};
    let githubClient;
    let taoInstance;

    return {
        /**
         * Initialise github client for the extension to release repository
         */
        async initialiseGithubClient() {
            const repoName = await taoInstance.getRepoName(data.extension.name);
            if (repoName) {
                githubClient = github(data.token, repoName);
            } else {
                log.exit('Unable to find the github repository name');
            }
        },

        /**
         * Load and initialise release extension config
         */
        async loadConfig() {
            log.doing('Loading config');
            data = Object.assign({}, await config.load());

            // Request github token if necessary
            if (!data.token) {
                setTimeout(() => opn('https://github.com/settings/tokens'), 2000);

                const { token } = await inquirer.prompt({
                    type: 'input',
                    name: 'token',
                    message: 'I need a Github token, with "repo" rights (check your browser)  : ',
                    validate: token => /[a-z0-9]{32,48}/i.test(token),
                    filter: token => token.trim()
                });

                data.token = token;

                await config.write(data);
            }
        },

        /**
         * Select and initialise the extension to release
         */
        async selectExtension() {
            const availableExtensions = await taoInstance.getExtensions();

            const { extension } = await inquirer.prompt({
                type: 'list',
                name: 'extension',
                message: 'Which extension you want to release ? ',
                pageSize: 12,
                choices: availableExtensions,
                default: data.extension && data.extension.name,
            });

            data.extension = {
                name: extension,
                path: `${data.taoRoot}/${extension}`,
            };

            await config.write(data);
        },

        async selectLastVersion() {
            const { lastVersionUsed } = await inquirer.prompt({
                type: 'input',
                name: 'lastVersionUsed',
                message: 'Last version used: ',
                default: '8.1.0'
            });

            if (!lastVersionUsed) {
                log.exit(`Please provide a correct version for extension '${data.extension}'.`);
            }

            data.extension.lastVersionUsed = semver.valid(semver.coerce(lastVersionUsed));
        },

        /**
         * Select and initialise tao instance
         */
        async selectTaoInstance() {
            const { taoRoot } = await inquirer.prompt({
                type: 'input',
                name: 'taoRoot',
                message: 'Path to the TAO instance : ',
                default: data.taoRoot || process.cwd()
            });

            taoInstance = taoInstanceFactory(path.resolve(taoRoot), false, wwwUser);

            const { dir, root } = await taoInstance.isRoot();

            if (!root) {
                log.exit(`${dir} is not a TAO instance`);
            }

            if (!await taoInstance.isInstalled()) {
                log.exit('It looks like the given TAO instance is not installed.');
            }

            data.taoRoot = dir;
        },

        /**
         * Extract all pull requests that has a version greather than last version used
         */
        async extractPullRequests() {
            log.doing('Extracting pull requests');
            const pullRequestsData = await githubClient.searchLastPullRequests();

            if (pullRequestsData && pullRequestsData.search && pullRequestsData.search.nodes && pullRequestsData.search.nodes.length){
                log.doing('Filtering pull requests');
                data.validPullRequests = pullRequestsData.search.nodes.filter((pr) => {
                    const version = semver.valid(semver.coerce(pr.title));
                    if (version) {
                        return semver.gte(version, data.extension.lastVersionUsed);
                    }
                });

            } else {
                log.exit('No PR data for this extension', pullRequestsData);
            }
        },

        /**
         * Extract release notes from release pull request
         */
        async extractReleaseNotes() {
            log.doing('Extracting release notes');

            if (data.validPullRequests.length) {
                data.releaseNotes = [];
                data.releaseNotes.push(...(await getPrData(githubClient, data.validPullRequests)));
            } else {
                log.exit('No valid PR found.');
            }
        },

        /**
         * Write a file with change log
         */
        writeChangeLog() {
            log.doing('Writing change log');

            const file = fs.createWriteStream(`./release_notes/${data.extension.name}_release_notes.md`);
            file.on('error', (err) => {
                log.exit(`Error writing file: ${err}`);
            });

            data.releaseNotes.forEach((note) => {
                if (note && note.version && semver.valid(semver.coerce(note.version)) && note.releaseNotes) {
                    file.write(`# ${note.version}\n`);
                    file.write('\n');
                    file.write(`${note.releaseNotes}`);
                    file.write('\n');
                    file.write('\n');
                }
            });
            file.end();
        }

    };
};
