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
 * Copyright (c) 2017-2019 Open Assessment Technologies SA;
 */

/**
 * This module let's you perform some actions on a Github repository
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @author Ricardo Proenca <ricardo@taotesting.com>
 */

const githubApiClientFactory = require('./githubApiClient');
const validate = require('./validate.js');

/**
 * Creates a github client helper
 * @param {String} token - the github token, with permissions to manage the repo
 * @param {String} repository - the github repository name
 * @returns {githubClient} the client
 */
module.exports = function githubFactory(token, repository) {

    //check parameters
    validate
        .githubToken(token)
        .githubRepository(repository);

    const githubApiClient = githubApiClientFactory(token);

    /**
     * @typedef {Object} githubClient
     */
    return {
        /**
         * Get the commits SHAs from a Pull Request
         * @param {String|Number} prNumber - the pull request number
         * @returns {Promise<String[]>} resolves with the list of SHAs
         */
        async getPRCommitShas(prNumber) {
            const commits = [];
            const [owner, name] = repository.split('/');

            let hasNextPage = true;
            let nextPageCursor = '';

            while (hasNextPage) {
                const {
                    repository: {
                        pullRequest: {
                            commits: {
                                nodes,
                                pageInfo
                            }
                        }
                    }
                } = await githubApiClient.getPRCommits(prNumber, name, owner, nextPageCursor);

                commits.push(...nodes
                    .map(({ commit: { oid } }) => oid.slice(0, 8))
                );

                hasNextPage = pageInfo.hasNextPage;
                nextPageCursor = pageInfo.endCursor;
            }

            return commits;
        },

        /**
         * Extract the release notes from a release pull request.
         * We first retrieve all commits included in the release,
         * then we filter out to get only sub pull requests.
         * We retrieve the data from each of this pull request to extract the relevant info.
         *
         * @param {String|Number} prNumber - the number of the release pull request
         * @returns {Promise<String>} resolves with the release note description
         */
        async extractReleaseNotesFromReleasePR(prNumber) {
            const commits = await this.getPRCommitShas(prNumber) || [];
            const chunkSize = 28;

            const issues = [];
            for (let i = 0; i < commits.length; i += chunkSize) {
                issues.push(...(await githubApiClient.searchPullRequests(
                    `${commits.slice(i, i + chunkSize).join(' ')} repo:${repository} type:pr base:develop is:merged`,
                )).search.nodes);
            }

            // Remove dublicates
            const uniqIssue = issues.filter((issue, index, self) =>
                index === self.findIndex((d) => (
                    d.number === issue.number
                ))
            );

            return uniqIssue
                .map(issue => ({
                    ...issue,
                    commit: issue && issue.commit && issue.commit.oid,
                }))
                .map(this.formatReleaseNote)
                .reduce((acc, note) => note ? `${acc} - ${note}\n` : acc, '');
        },

        /**
         * Format a release note string from release note data
         * @param {Object} noteData - the
         * @param {String} [noteData.title] - the title of original PR
         * @param {String} [noteData.number] - the number of the original PR
         * @param {String} [noteData.url] - the URL to the PR
         * @param {String} [noteData.commit] - the merge commit SHA
         * @param {String} [noteData.body] - the PR body
         * @returns {String} the release note description
         */
        formatReleaseNote(noteData) {
            const note = [];
            const typeExp = /(fix|feature|breaking)/i;
            const jiraIdExp = /[A-Z]{2,6}[- ]{1}[0-9]{1,6}/i;

            //internal extraction helper
            const extract = (string = '', exp) => {
                let match = string.match(exp);
                if (match !== null && match.index > -1) {
                    return match[0];
                }
                return false;
            };

            //extract the type of change
            const extractType = () => {
                var type;

                if (noteData.branch) {
                    type = extract(noteData.branch, typeExp);
                }
                if (!type && noteData.title) {
                    type = extract(noteData.title, typeExp);
                }
                if (type) {
                    type = type.trim();
                    type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                }
                return type;
            };

            if (noteData) {
                const type = extractType();
                if (type) {
                    note.push(`${type}`);
                }

                if (note.length) {
                    note.push(': ');
                }
                if (noteData.title) {
                    note.push(
                        noteData.title
                            .replace(typeExp, '')
                            .replace(jiraIdExp, '')
                            .replace(/\//g, '')
                            .replace(/\s\s+/g, ' ')
                            .trim()
                    );
                }
            }
            return note.join('');
        },

        /**
         * Search last 100 github pull requests
         * @returns {Object}
         */
        async searchLastPullRequests() {
            return githubApiClient.searchLastPullRequests(`repo:${repository} type:pr base:master is:merged`);
        }

    };
};
