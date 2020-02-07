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

const log = require('../log.js');

/**
 * A collection of functions about Release Notes
 *
 * @param {module} requests
 * @returns {Object} notes module instance
 */
module.exports = function notesFactory(requests) {

    return {
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
         * TODO: deprecate?
         */
        async extractReleaseNotes(pullRequests) {
            log.doing('Extracting release notes');

            if (!pullRequests | !pullRequests.length) {
                log.error('No valid PR found to extract from.');
                return [];
            }

            const releaseNotes = [...(await requests.getReleaseNotesFromPullRequest(pullRequests))];
            log.info(`${releaseNotes.length} versions with notes found.`);
            return releaseNotes;
        }
    };
};
