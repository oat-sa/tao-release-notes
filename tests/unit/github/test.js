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
 * Copyright (c) 2018-2019 Open Assessment Technologies SA;
 */

/**
 *
 * Unit test the module src/github.js
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

const test       = require('tape');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const token = 'ffaaffe5a8';
const repo  = 'foo-sa/bar-project';

const sandbox = sinon.sandbox.create();

const githubApiClientInstance = {
    getPRCommits: () => {},
    searchPullRequests: () => {},
};
const githubApiClientFactory = sandbox.stub().callsFake(() => githubApiClientInstance);

//load the tested module and mock octonode
const github = proxyquire.noCallThru().load('../../../src/github.js', {
    octonode : {
        client(){
            return {
                repo(){
                    return {
                        pr(data, cb){
                            cb(null, { number : 12 });
                        }
                    };
                }
            };
        }
    },
    './githubApiClient': githubApiClientFactory,
});

test('the module api', t => {
    t.plan(2);

    t.ok(typeof github === 'function', 'The module exports a function');
    t.ok(typeof github(token, repo) === 'object', 'The module function creates an object');

    t.end();
});

test('the github client factory', t => {
    t.plan(8);

    t.throws(() => github(), TypeError, /^Please use the Github client with a valid token$/);
    t.throws(() => github(''), TypeError, /^Please use the Github client with a valid token$/);
    t.throws(() => github('foo'), TypeError, /^Please use the Github client with a valid token$/);
    t.throws(() => github('a1'), TypeError, /^Please use the Github client with a valid token$/);

    t.throws(() => github(token), TypeError, /^Please provide the Github repository formatted as/);
    t.throws(() => github(token, ''), TypeError, /^Please provide the Github repository formatted as$/);
    t.throws(() => github(token, 'bar'), TypeError, /^Please provide the Github repository formatted as$/);

    t.ok(typeof github(token, repo) === 'object', 'The module function creates an object');

    t.end();
});

test('the method formatReleaseNote', t => {
    t.plan(5);

    let ghclient = github(token, repo);

    t.equal(typeof ghclient.formatReleaseNote, 'function', 'The client exposes the method formatReleaseNote');

    t.equal(ghclient.formatReleaseNote(), '', 'Without note data the release note is empty');

    t.equal(ghclient.formatReleaseNote({
        title:    'Feature/tao 9986 human brain UI driver',
        number:   '12001',
        url:      'https://github.com/oat-sa/tao-core/pull/12001',
        user:     'johndoe',
        assignee: 'janedoe',
        commit:   '123456a',
        body:     'Please enable to brain driver protocol in the browser first',
        branch:   'feature/TAO-9986_human-brain-UI-driver'
    }), 'Feature: human brain UI driver');

    t.equal(ghclient.formatReleaseNote({
        title:    'feature/tao 9986 human brain UI driver',
        number:   '12001',
        url:      'https://github.com/oat-sa/tao-core/pull/12001',
        commit:   '123456a',
    }), 'Feature: human brain UI driver');

    t.equal(ghclient.formatReleaseNote({
        title:    'backport/fix/tao 1984 fix big brother backdoor',
        number:   '109084',
        url:      'https://github.com/oat-sa/tao-core/pull/109084',
        user:     'winston',
        assignee: 'julia',
        commit:   '654987a',
        body:     '',
        branch:   'backport/fix/TAO-1984_fix-big-brother-backdoor'
    }), 'Fix: backport fix big brother backdoor');

    t.end();
});

test('the getPRCommitShas method', async (t) => {
    t.plan(4);

    const [owner, name] = repo.split('/');
    const prNumber = 1234;

    const ghclient = github(token, repo);

    t.equal(typeof ghclient.getPRCommitShas, 'function', 'The client exposes the method formatReleaseNote');

    const commits = {
        repository: {
            pullRequest: {
                commits: {
                    nodes: [
                        { commit: { oid: '1' } },
                        { commit: { oid: '2' } },
                    ],
                    pageInfo: {
                        hasNextPage: false,
                    },
                },
            },
        },
    };

    sandbox.stub(githubApiClientInstance, 'getPRCommits').returns(commits);

    const actual = await ghclient.getPRCommitShas(prNumber);

    t.equal(githubApiClientInstance.getPRCommits.callCount, 1, 'Commits have been requested');
    t.ok(
        githubApiClientInstance.getPRCommits.calledWith(
            prNumber,
            name,
            owner,
            ''
        ),
        'Commits have been requested with appropriate arguments'
    );
    t.deepEqual(
        actual,
        commits.repository.pullRequest.commits.nodes.map(({ commit: { oid } }) => oid.slice(0, 8)),
        'Commits have been returned'
    );

    sandbox.restore();
    t.end();
});

test('the extractReleaseNotesFromReleasePR method', async (t) => {
    t.plan(3);

    const prNumber = 1234;

    const ghclient = github(token, repo);

    t.equal(typeof ghclient.extractReleaseNotesFromReleasePR, 'function', 'The client exposes the method formatReleaseNote');

    const commits = {
        repository: {
            pullRequest: {
                commits: {
                    nodes: [
                        { commit: { oid: '1' } },
                        { commit: { oid: '2' } },
                    ],
                    pageInfo: {
                        hasNextPage: false,
                    },
                },
            },
        },
    };

    sandbox.stub(githubApiClientInstance, 'getPRCommits').returns(commits);
    sandbox.stub(githubApiClientInstance, 'searchPullRequests').returns({ search: { nodes: [] } });

    await ghclient.extractReleaseNotesFromReleasePR(prNumber);

    t.equal(githubApiClientInstance.searchPullRequests.callCount, 1, 'Commits have been requested');
    t.ok(
        githubApiClientInstance.searchPullRequests.calledWith(
            '1 2 repo:foo-sa/bar-project type:pr base:develop is:merged',
        ),
        'Commits have been requested with appropriate arguments'
    );

    sandbox.restore();
    t.end();
});
