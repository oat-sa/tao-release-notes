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
 * Unit test the function findFirstValidPullRequest of the module src/notes/versioning.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const versioning = rewire('../../../../../src/notes/versioning.js');

versioning.__set__('log', {
    error: () => {}
});

const pullRequests = [
    { title: 'Release 3' },
    { title: 'Release 1.2.3' },
    { title: 'Release 1.2.0' },
    { title: 'Pre-release' },
];
const badPullRequests = [
    { title: 'Bugfix' },
    { title: 'Merge develop' },
    { title: 'Pre-release' },
];
test('the module api', t => {
    t.plan(2);
    t.ok(typeof versioning === 'object', 'The module exports an object');
    t.ok(typeof versioning.findFirstValidPullRequest === 'function', 'The versioning object contains a findFirstValidPullRequest function');
    t.end();
});

test('returns {} if missing argument', async t => {
    t.plan(1);
    const res = await versioning.findFirstValidPullRequest();
    t.equal(res, null, 'Missing input produces null result');
    t.end();
});

test('returns {} if no PRs', async t => {
    t.plan(1);
    const res = await versioning.findFirstValidPullRequest([]);
    t.deepEqual(res, null, 'Empty input produces null result');
    t.end();
});

test('returns no valid PR from invalid PRs', async t => {
    t.plan(1);
    const res = await versioning.findFirstValidPullRequest(badPullRequests);
    t.deepEqual(res, null, 'Invalid input produces null result');
    t.end();
});

test('returns first valid PR', async t => {
    t.plan(1);
    const res = await versioning.findFirstValidPullRequest(pullRequests);
    t.equal(res.title, 'Release 1.2.0', 'Correct first PR found');
    t.end();
});
