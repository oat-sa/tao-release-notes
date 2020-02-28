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
 * Unit test the function filterPullRequests of the module src/notes/requests.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const requestsFactory = rewire('../../../../../src/notes/requests.js');

requestsFactory.__set__('log', {
    error: () => {}
});

const requests = requestsFactory();

const pullRequests = [
    { title: 'Re-release it' },
    { title: 'Release 2.0.0' },
    { title: 'Release 1.7.10' },
    { title: 'Release 1.7.9.1' },
    { title: 'Release 1.7.9' },
    { title: 'Hotfix' },
    { title: 'Release 1.2.3-alpha' },
    { title: 'Release 1.2.3' },
    { title: 'Release 1.2.0' },
];
const startVersion = '1.2.3';
const endVersion = '1.7.9';

test('the module api', t => {
    t.plan(2);
    t.ok(typeof requests === 'object', 'The module exports an object');
    t.ok(typeof requests.filterPullRequests === 'function', 'The requests object contains a filterPullRequests function');
    t.end();
});

test('returns [] if no PRs', async t => {
    t.plan(1);
    const res = await requests.filterPullRequests(null, startVersion, endVersion);
    t.equal(res.length, 0, 'Empty input produces empty result set');
    t.end();
});

test('returns filtered PRs', async t => {
    t.plan(5);
    const res = await requests.filterPullRequests(pullRequests, startVersion, endVersion);
    t.equal(res.length, 4, 'Correct number of filtered PRs');
    const titles = res.map(pr => pr.title);
    t.ok(titles.includes('Release 1.7.9.1'), 'PR is included');
    t.ok(titles.includes('Release 1.7.9'), 'PR is included');
    t.ok(titles.includes('Release 1.2.3-alpha'), 'PR is included');
    t.ok(titles.includes('Release 1.2.3'), 'PR is included');
    t.end();
});

test('missing start version', async t => {
    t.plan(1);
    const res = await requests.filterPullRequests(pullRequests, null, endVersion);
    t.equal(res.length, 0, 'Missing startVersion produces empty result set');
    t.end();
});

test('missing end version', async t => {
    t.plan(1);
    const res = await requests.filterPullRequests(pullRequests, startVersion, null);
    t.equal(res.length, 0, 'Missing endVersion produces empty result set');
    t.end();
});
