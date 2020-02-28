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

/**
 * Unit test the function getReleaseNotesFromPullRequests of the module src/notes/requests.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const requestsFactory = rewire('../../../../../src/notes/requests.js');

requestsFactory.__set__('github',  () => ({
    extractReleaseNotesFromReleasePR: (prNumber) => prNumber ? `Release notes for PR ${prNumber}` : null
}));

const requests = requestsFactory();

requests.initStandaloneGithubClient();

const pullRequests = [
    { title: 'Re-release it', number: 15 },
    { title: 'Release 2.0.0', number: 14 },
    { title: 'Release 1.7.10', number: 13 },
    { title: 'Release 1.7.9.1', number: 12 },
    { title: 'Release 1.7.9', number: 11 },
    { title: 'Hotfix', number: 10 },
    { title: 'Release 1.2.3-alpha', number: 9 },
    { title: 'Release 1.2.3', number: 8 },
    { title: 'Release 1.2.0' },
];

test('the module api', t => {
    t.plan(2);
    t.ok(typeof requests === 'object', 'The module exports an object');
    t.ok(typeof requests.getReleaseNotesFromPullRequests === 'function', 'The requests object contains a getReleaseNotesFromPullRequests function');
    t.end();
});

test('returns [] if no PRs', async t => {
    t.plan(1);
    const res = await requests.getReleaseNotesFromPullRequests();
    t.equal(res.length, 0, 'Missing input produces empty result set');
    t.end();
});

test('returns transformed PRs', async t => {
    t.plan(3);
    const res = await requests.getReleaseNotesFromPullRequests(pullRequests);
    t.equal(res.length, 6, 'Correct number of filtered PRs');
    t.deepEqual(res[0], { version: '2.0.0', releaseNotes: 'Release notes for PR 14' }, 'The first notes match the input');
    t.deepEqual(res[5], { version: '1.2.3', releaseNotes: 'Release notes for PR 8' }, 'The last notes match the input');
    t.end();
});
