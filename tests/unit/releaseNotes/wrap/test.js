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
 * Unit test the function writeChangeLog of the module src/releaseNotes.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const sinon = require('sinon');
const test = require('tape');
const rewire = require('rewire');
const releaseNotes = rewire('../../../../src/releaseNotes.js');

// Private function under test:
const wrap = releaseNotes.__get__('wrap');

const sandbox = sinon.sandbox.create();

const logMock = {
    title: () => {},
    done: () => {},
    error: () => {}
};
releaseNotes.__set__('log', logMock);

test('the module api', t => {
    t.plan(1);
    t.ok(typeof wrap === 'function', 'The wrap function exists');
    t.end();
});

test('it runs synchronous code', async t => {
    t.plan(1);
    const internalLogic = () => true;
    sandbox.stub(logMock, 'done');

    await wrap.bind(null, internalLogic)();

    t.equal(logMock.done.callCount, 1, 'log.done was called');

    sandbox.restore();
    t.end();
});

test('it runs async code', async t => {
    t.plan(1);
    const internalLogic = () => Promise.resolve(true);
    sandbox.stub(logMock, 'done');

    await wrap.bind(null, internalLogic)();

    t.equal(logMock.done.callCount, 1, 'log.done was called');

    sandbox.restore();
    t.end();
});

test('it passes the arguments through', async t => {
    t.plan(3);
    const internalLogic = sandbox.stub();
    sandbox.stub(logMock, 'done');

    await wrap.bind(null, internalLogic)(1,2,3);

    t.equal(internalLogic.callCount, 1, 'internalLogic was called');
    t.ok(internalLogic.calledWithExactly(1,2,3), 'internalLogic received passed args');
    t.equal(logMock.done.callCount, 1, 'log.done was called');

    sandbox.restore();
    t.end();
});

test('it catches & logs errors', async t => {
    t.plan(2);
    const internalLogic = () => { throw new Error('Something bad happened'); };
    sandbox.stub(logMock, 'error');

    await wrap.bind(null, internalLogic)();

    t.equal(logMock.error.callCount, 1, 'log.error was called');
    t.equal(logMock.error.getCall(0).args[0].toString(), 'Error: Something bad happened', 'Caught error had correct message');

    sandbox.restore();
    t.end();
});
