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
 * Integration test of part of the module src/notes/io.js
 * -> getComposers
 *   -> promptForComposerJson
 *     -> readComposerFiles
 *       -> readComposerJsonDeps
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const io = rewire('../../../../../src/notes/io.js');
const path = require('path');
const sinon = require('sinon');

const logMock = {
    error: () => {},
    exit: () => {}
};
io.__set__('log', logMock);

const inquirerMock = {
    prompt: () => 'boop'
};
io.__set__('inquirer', inquirerMock);

const sandbox = sinon.sandbox.create();

test('the module api', t => {
    t.plan(5);
    t.ok(typeof io === 'object', 'The module returns an object');
    t.ok(typeof io.getComposers === 'function', 'The getComposers function exists');
    t.ok(typeof io.promptForComposerJson === 'function', 'The promptForComposerJson function exists');
    t.ok(typeof io.readComposerFiles === 'function', 'The readComposerFiles function exists');
    t.ok(typeof io.readComposerJsonDeps === 'function', 'The readComposerJsonDeps function exists');
    t.end();
});

test('it prompts for and reads 2 files from disk', async t => {
    t.plan(5);

    const file1Path = path.join(__dirname, '../../../../fixtures/small-composer.json');
    const file2Path = path.join(__dirname, '../../../../fixtures/small-composer2.json');

    const file1ExpectedContent = {
        'oat-sa/generis': '11.0.0',
        'oat-sa/tao-core': '39.0.0',
        'oat-sa/extension-tao-itemqti-pci': '6.1.2'
    };
    const file2ExpectedContent = {
        'oat-sa/generis': '12.6.0',
        'oat-sa/tao-core': '40.3.4.1',
        'oat-sa/extension-tao-group': '6.2.0'
    };

    sandbox.stub(inquirerMock, 'prompt')
        .onFirstCall().returns({ composerJsonPath: file1Path })
        .onSecondCall().returns({ composerJsonPath: file2Path });

    sandbox.stub(logMock, 'error');
    sandbox.stub(logMock, 'exit');

    const res = await io.getComposers();

    t.deepEqual(Object.keys(res), ['exts1', 'exts2'], 'the correct keys are returned');
    t.deepEqual(res.exts1, file1ExpectedContent, 'the first composer deps are extracted');
    t.deepEqual(res.exts2, file2ExpectedContent, 'the second composer deps are extracted');

    t.equal(logMock.error.callCount, 0, 'log.error was never called');
    t.equal(logMock.exit.callCount, 0, 'log.exit was never called');

    sandbox.restore();
    t.end();
});
