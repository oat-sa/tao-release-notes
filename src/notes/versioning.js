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
const inquirer = require('inquirer');

const log = require('../log.js');

/**
 * A stateless collection of functions about semantic versioning
 *
 * @returns {Object} versioning module instance
 */
module.exports = {
    /**
     * Find the first valid pull request
     * @private
     * @param {Array} pullRequests
     * @returns {Object} single PR
     */
    findFirstValidPullRequest(pullRequests) {
        return this.findLastValidPullRequest(pullRequests.reverse());
    },

    /**
     * Find the last valid pull request
     * @private
     * @param {Array} pullRequests
     * @returns {Object} single PR
     */
    findLastValidPullRequest(pullRequests) {
        if (pullRequests.length) {
            return pullRequests.find(pr => {
                return semver.valid(semver.coerce(pr.title)); // ??
            });
        }
        else {
            log.error('There are no pull requests to fetch version');
            return {};
        }
    },

    /**
     * Make sure both versions are well-defined by prompting or cleaning
     * @param {String} startVersion
     * @param {String} endVersion
     * @param {Array} pullRequests
     * @param {Boolean} [autoVersions=false]
     * @returns {Object} versions
     */
    async defineVersions(startVersion, endVersion, pullRequests, autoVersions = false) {
        // One or the other could be empty, but not both!
        // Prompt if missing
        if (!startVersion) {
            startVersion = await this.selectStartVersion(pullRequests, autoVersions);
        }
        else if (!endVersion) {
            endVersion = await this.selectEndVersion(pullRequests, autoVersions);
        }
        // Even if versions provided, we should clean up modifiers
        else {
            startVersion = semver.valid(semver.coerce(startVersion));
            endVersion = semver.valid(semver.coerce(endVersion));
        }

        return {
            startVersion,
            endVersion
        };
    },

    /**
     * Select earliest version to pull release notes from
     * @param {Array} [pullRequests]
     * @param {Boolean} [autoVersions=false]
     * @returns {String|null} chosen version
     */
    async selectStartVersion(pullRequests = [], autoVersions = false) {
        let version = '';
        if (pullRequests && pullRequests.length) {
            const firstValidPr = this.findFirstValidPullRequest(pullRequests);
            version = `${semver.valid(semver.coerce(firstValidPr.title))}`;
        }

        if (!autoVersions) {
            const { startVersion } = await inquirer.prompt({
                type: 'input',
                name: 'startVersion',
                message: '🚩 Starting version to pull release notes: [s to skip]',
                default: version
            });

            if (!startVersion || startVersion === 's') {
                log.info('No start version, skipping extension.');
                return null;
            }
            version = startVersion;
        }

        log.done(`Start version selected: ${version}`);
        return version;
    },

    /**
     * Select last version to pull release notes from
     * @param {Array} [pullRequests]
     * @param {Boolean} [autoVersions=false]
     * @returns {String|null} chosen version
     */
    async selectEndVersion(pullRequests = [], autoVersions = false) {
        let version = '';
        if (pullRequests && pullRequests.length) {
            const lastValidPr = this.findLastValidPullRequest(pullRequests);
            version = `${semver.valid(semver.coerce(lastValidPr.title))}`;
        }

        if (!autoVersions) {
            const { endVersion  } = await inquirer.prompt({
                type: 'input',
                name: 'endVersion',
                message: '🏁 Ending version to pull release notes: [s to skip] ',
                default: version
            });

            if (!endVersion || endVersion === 's') {
                log.info('No end version, skipping extension.');
                return null;
            }
            version = endVersion ;
        }

        log.done(`End version selected: ${version}`);
        return version;
    }
};
