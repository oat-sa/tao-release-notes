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

/**
 * Get the taoExtensionRelease
 *
 * @param {String} wwwUser - name of the www user
 * @param {Array} extensionsSelected - array of extensions to parse
 * @return {Object} - instance of taoExtensionRelease
 */
module.exports = function taoExtensionReleaseFactory(wwwUser, extensionsSelected) {
    let data = {};
    let githubClient;
    let taoInstance;

    return {
        /**
         * Initialise github client for the extension repository
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
         * Shows all exrtensions to parse
         */
        async showExtensions() {
            const { extensionsOk } = await inquirer.prompt({
                type: 'confirm',
                name: 'extensionsOk',
                message: `Extensions selected \n     - ${extensionsSelected.join('\n     - ')}\n\nCan we proceed ?`
            });

            if (!extensionsOk) {
                log.exit();
            }
        },

        /**
         * Select and initialise the extension
         */
        async selectExtension(extensionName = null) {
            if (!extensionName) {

                const availableExtensions = await taoInstance.getExtensions();

                const { extension } = await inquirer.prompt({
                    type: 'list',
                    name: 'extension',
                    message: 'Which extension you want to release ? ',
                    pageSize: 12,
                    choices: availableExtensions,
                    default: data.extension && data.extension.name,
                });

                extensionName = extension;
            }

            data.extension = {
                name: extensionName,
                path: `${data.taoRoot}/${extensionName}`,
            };

            await config.write(data);
            log.done(`Extension selected: ${ data.extension.name}`);
        },

        /**
          *
          * @param {Object} options
          */
        async selectLastVersion(options = null) {
            const lastValidPr = this.findLastValidPullRequest(data.pullRequests);
            let lastVersion = `${semver.valid(semver.coerce(lastValidPr.title))}`;

            if (!options || !options.autoSelectLastVersion) {
                const { lastVersionUsed } = await inquirer.prompt({
                    type: 'input',
                    name: 'lastVersionUsed',
                    message: 'From which starting version you want to pull release notes: ',
                    default: lastVersion
                });

                if (!lastVersionUsed) {
                    log.exit(`Please provide a correct version for extension '${data.extension}'.`);
                }

                lastVersion = lastVersionUsed;
            }

            data.extension.lastVersionUsed = lastVersion;
            log.done(`Version selected: ${ data.extension.lastVersionUsed}`);
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
                data.pullRequests = pullRequestsData.search.nodes;
            } else {
                log.exit('No PR data for this extension', pullRequestsData);
            }
        },

        async filterPullRequests() {
            log.doing('Filtering pull requests');
            if (data.pullRequests){
                data.filteredPullRequests = data.pullRequests.filter((pr) => {
                    const version = semver.valid(semver.coerce(pr.title));
                    if (version) {
                        return semver.gte(version, data.extension.lastVersionUsed);
                    }
                });

                if (data.filteredPullRequests.length){
                    data.pullRequests = []; // invalidate pull request once we filter all
                } else {
                    log.exit('No valid versions for PR data', data.pullRequests);
                }

            } else {
                log.exit('No PR data', data.pullRequests);
            }
        },

        /**
         * Extract release notes from pull requests
         */
        async extractReleaseNotes() {
            log.doing('Extracting release notes');
            let selectPullRequests;
            data.releaseNotes = [];

            if (data.filteredPullRequests && data.filteredPullRequests.length) {
                selectPullRequests = data.filteredPullRequests; // parse filtered pull requests

            } else if (data.pullRequests && data.pullRequests.length) {
                selectPullRequests = data.pullRequests; // parse unfiltered pull requests

            } else {
                log.exit('No valid PR found.');
            }

            data.releaseNotes.push(...(await this.getReleaseNotesFromPullRequest(selectPullRequests)));
        },

        /**
         * Write a file with change log
         */
        async writeChangeLog() {
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
        },

        /**
         * Get release notes from single pull request
         * @private
         * @param {*} validPr - pull request
         */
        async getReleaseNotesFromPullRequest(validPr) {
            return await Promise.all(validPr.map(async (prData) => {
                const version = semver.valid(semver.coerce(prData.title));
                const releaseNotes = await githubClient.extractReleaseNotesFromReleasePR(prData.number);
                if (version && releaseNotes) {
                    return { version, releaseNotes };
                }
            }));
        },

        /**
         * Find the last valid pull request
         * @private
         * @param pullRequests - pull requests array
         */
        findLastValidPullRequest(pullRequests) {
            if (pullRequests.length) {
                return pullRequests.find ((pr) => {
                    return semver.valid(semver.coerce(pr.title));
                });
            } else {
                log.exit('There are no pull requests to fetch version');
            }
        }

    };
};
