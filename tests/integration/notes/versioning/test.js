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
 * Integration test of part of the module src/notes/versioning.js
 * -> defineVersions
 *   -> selectStartVersion
 *     -> findFirstValidPullRequest
 *   -> selectEndVersion
 *     -> findLastValidPullRequest
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const versioning = rewire('../../../../src/notes/versioning.js');
const sinon = require('sinon');

const logMock = {
    info: () => {},
    done: () => {},
    error: () => {},
    exit: () => {}
};
versioning.__set__('log', logMock);

const inquirerMock = {
    prompt: () => 'boop'
};
versioning.__set__('inquirer', inquirerMock);

const sandbox = sinon.sandbox.create();

test('the module api', t => {
    t.plan(6);
    t.ok(typeof versioning === 'object', 'The module returns an object');
    t.ok(typeof versioning.defineVersions === 'function', 'The defineVersions function exists');
    t.ok(typeof versioning.findFirstValidPullRequest === 'function', 'The findFirstValidPullRequest function exists');
    t.ok(typeof versioning.findLastValidPullRequest === 'function', 'The findLastValidPullRequest function exists');
    t.ok(typeof versioning.selectStartVersion === 'function', 'The selectStartVersion function exists');
    t.ok(typeof versioning.selectEndVersion === 'function', 'The selectEndVersion function exists');
    t.end();
});

test('it prompts for undefined versions and extracts the correct range', async t => {
    t.plan(7);

    sandbox.stub(inquirerMock, 'prompt')
        .onFirstCall().returns({ startVersion: '1.2.3' })
        .onSecondCall().returns({ endVersion: '1.7.9' });

    sandbox.stub(logMock, 'info');
    sandbox.stub(logMock, 'done');
    sandbox.stub(logMock, 'error');
    sandbox.stub(logMock, 'exit');

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
    const expected = { startVersion: '1.2.3', endVersion: '1.7.9' };

    const res = await versioning.defineVersions(null, null, pullRequests, false);

    t.equal(inquirerMock.prompt.getCall(0).args[0].default, '1.2.0', 'Inquirer had correct default for first PR');
    t.equal(inquirerMock.prompt.getCall(1).args[0].default, '2.0.0', 'Inquirer had correct default for last PR');

    t.deepEqual(res, expected, 'the correct versions are returned');

    t.equal(logMock.info.callCount, 0, 'log.info was never called');
    t.equal(logMock.error.callCount, 0, 'log.error was never called');
    t.equal(logMock.exit.callCount, 0, 'log.exit was never called');
    t.equal(logMock.done.callCount, 2, 'log.done was called twice');

    sandbox.restore();
    t.end();
});
