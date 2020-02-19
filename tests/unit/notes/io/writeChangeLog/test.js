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
 * Unit test the function writeChangeLog of the module src/notes/io.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const sinon = require('sinon');
const test = require('tape');
const rewire = require('rewire');
const io = rewire('../../../../../src/notes/io.js');

const sandbox = sinon.sandbox.create();

const fileMock = {
    write: () => {},
    end: () => {},
    on: () => {}
};
const createWriteStreamMock = sandbox.stub().callsFake(() => fileMock);

io.__set__('fs', {
    createWriteStream: createWriteStreamMock
});
io.__set__('log', {
    doing: () => {}
});

test('the module api', t => {
    t.plan(4);
    t.ok(typeof io === 'object', 'The module exports an object');
    t.ok(typeof io.writeChangeLog === 'function', 'The io object contains a writeChangeLog function');
    t.ok(typeof io.writeToMarkdownFile === 'function', 'The io object contains a writeToMarkdownFile function');
    t.ok(typeof io.writeToCsvFile === 'function', 'The io object contains a writeToCsvFile function');
    t.end();
});

test('writeChangeLog function: markdown', async (t) => {
    t.plan(7);

    const repoName = 'oat-sa/extension-tao-foobar';
    const outputDir = 'release_notes';
    const releaseNotes = [
        { version: '1.2.3', releaseNotes: '- Fix: all bugs gone\n- Feature: blink tags everywhere\n' },
        { version: '1.0.0', releaseNotes: '- Breaking: upgrade ActionScript\n' }
    ];
    const format = 'md';

    sandbox.stub(fileMock, 'write');
    sandbox.stub(fileMock, 'end');

    await io.writeChangeLog(repoName, outputDir, releaseNotes, format);

    t.equal(createWriteStreamMock.callCount, 1, 'createWriteStream has been called');
    t.equal(createWriteStreamMock.getCall(0).args[0], 'release_notes/oat-sa_extension-tao-foobar_release_notes.md', 'createWriteStream has been called with the filename');

    t.equal(fileMock.write.callCount, 5, 'write has been called sufficient times');
    t.equal(fileMock.write.getCall(0).args[0], '# oat-sa_extension-tao-foobar\n', 'writes the heading');
    t.equal(fileMock.write.getCall(1).args[0], '\n## 1.2.3\n', 'writes the version subheading');
    t.equal(fileMock.write.getCall(2).args[0], '\n- Fix: all bugs gone\n- Feature: blink tags everywhere\n', 'writes the notes block');

    t.equal(fileMock.end.callCount, 1, 'end has been called');

    createWriteStreamMock.resetHistory();
    sandbox.restore();
    t.end();
});

test('writeChangeLog function: csv', async (t) => {
    t.plan(7);

    const repoName = 'oat-sa/extension-tao-foobar';
    const outputDir = 'release_notes';
    const releaseNotes = [
        { version: '1.2.3', releaseNotes: '- Fix: all bugs gone\n- Feature: blink, tags, everywhere\n' },
        { version: '1.0.0', releaseNotes: '- Breaking: upgrade ActionScript\n' }
    ];
    const format = 'csv';

    sandbox.stub(fileMock, 'write');
    sandbox.stub(fileMock, 'end');

    await io.writeChangeLog(repoName, outputDir, releaseNotes, format);

    t.equal(createWriteStreamMock.callCount, 1, 'createWriteStream has been called');
    t.equal(createWriteStreamMock.getCall(0).args[0], 'release_notes/oat-sa_extension-tao-foobar_release_notes.csv', 'createWriteStream has been called with the filename');

    t.equal(fileMock.write.callCount, 3, 'write has been called sufficient times');
    t.equal(fileMock.write.getCall(0).args[0], 'oat-sa_extension-tao-foobar,1.2.3,Fix: all bugs gone\n', 'writes row 1');
    t.equal(fileMock.write.getCall(1).args[0], 'oat-sa_extension-tao-foobar,1.2.3,Feature: blink tags everywhere\n', 'writes row 2');
    t.equal(fileMock.write.getCall(2).args[0], 'oat-sa_extension-tao-foobar,1.0.0,Breaking: upgrade ActionScript\n', 'writes row 3');

    t.equal(fileMock.end.callCount, 1, 'end has been called');

    createWriteStreamMock.resetHistory();
    sandbox.restore();
    t.end();
});
