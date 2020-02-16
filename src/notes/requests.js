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

const semver = require('semver');
const fetch = require('node-fetch');

const log = require('../log.js');
const github = require('../github.js');

/**
 * A collection of functions for fetching remote data
 *
 * @returns {Object} requests module instance
 */
module.exports = function requestsFactory() {

    let githubClient;

    return {
        /**
         * Create a third-party client for accessing Github's API
         * @param {String} token
         * @param {String} repoName
         */
        initStandaloneGithubClient(token, repoName) {
            try {
                githubClient = github(token, repoName);
            }
            catch (err) {
                log.error(err);
            }
        },

        /**
         * Fetches a given tao-community compooser.json content from github
         * @param {String} version
         * @returns {Object} dependencies
         */
        async resolveTaoCommunityComposer(version) {
            // Try to read composer.json via github tagged commit
            log.doing(`Looking up tao-community v${version} on github`);
            const fileUrl = `https://raw.githubusercontent.com/oat-sa/tao-community/v${version}/composer.json`;
            try {
                const response = await fetch(fileUrl);
                const fileData = await response.json();
                return fileData.require;
            }
            catch (err) {
                log.error(`Could not resolve tao-community v${version}`);
                log.error(err);
                return {};
            }
        },

        /**
         * Extract all pull requests that has a version greater than last version used
         * @returns {Array}
         */
        async fetchAllPullRequests() {
            log.doing('Fetching pull requests');
            const pullRequestsData = await githubClient.searchLastPullRequests();
            if (pullRequestsData
                && pullRequestsData.search
                && pullRequestsData.search.nodes) {
                return pullRequestsData.search.nodes;
            }
            else {
                log.error('No valid PRs found.');
                return [];
            }
        },

        /**
         * Filter full list of PRs down to those within the desired version range
         * @param {Array} pullRequests
         * @param {String} startVersion
         * @param {String} endVersion
         * @returns {Array} PRs
         */
        async filterPullRequests(pullRequests, startVersion, endVersion) {
            if (!pullRequests) {
                log.error('No PR data', pullRequests);
                return [];
            }
            if (!startVersion || !endVersion) {
                log.error('One or both versions missing:', startVersion, endVersion);
                return [];
            }

            // Filter function
            const inRange = (pr) => {
                const version = semver.valid(semver.coerce(pr.title));
                if (version) {
                    return semver.satisfies(version, `${startVersion} - ${endVersion}`);
                }
                return false;
            };

            return pullRequests.filter(inRange);
        },

        /**
         * Extract release notes from pull requests
         * @param {Array} pullRequests
         * @returns {Array} release notes
         */
        async extractReleaseNotes(pullRequests = []) {
            log.doing('Extracting release notes');

            if (!pullRequests | !pullRequests.length) {
                log.error('No valid PR found to extract from.');
                return [];
            }

            const releaseNotes = [...(await this.getReleaseNotesFromPullRequests(pullRequests))];
            log.info(`${releaseNotes.length} versions with notes found.`);
            return releaseNotes;
        },

        /**
         * Get release notes from single pull request
         * @private
         * @param {Array} pullRequests
         * @returns {Array} versions & release notes
         */
        async getReleaseNotesFromPullRequests(pullRequests = []) {
            return (await Promise.all(
                pullRequests
                    .map(async (prData) => {
                        const version = semver.valid(semver.coerce(prData.title));
                        const releaseNotes = await githubClient.extractReleaseNotesFromReleasePR(prData.number);
                        // console.log(releaseNotes);
                        return { version, releaseNotes };
                    })
            )).filter(pr => pr.version && pr.releaseNotes);
        }
    };
};
