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

const stream = require('stream');
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
const fileStreamMock = new stream.PassThrough();
const createWriteStreamMock = sandbox.stub().callsFake(() => fileStreamMock);

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

test.only('writeChangeLog function: markdown', (t) => {
    t.plan(10);

    const repoName = 'oat-sa/extension-tao-foobar';
    const outputDir = 'release_notes';
    const releaseNotes = [
        { version: '1.2.3', releaseNotes: '- Fix: all bugs gone\n- Feature: blink tags everywhere\n' },
        { version: '1.0.0', releaseNotes: '- Breaking: upgrade ActionScript\n' }
    ];
    const format = 'md';

    sandbox.stub(fileStreamMock, 'write');
    sandbox.stub(fileStreamMock, 'end');

    io.writeChangeLog(repoName, outputDir, releaseNotes, format);
    fileStreamMock.emit('open');

    t.equal(createWriteStreamMock.callCount, 1, 'createWriteStream has been called');
    t.equal(createWriteStreamMock.getCall(0).args[0], 'release_notes/oat-sa_extension-tao-foobar_release_notes.md', 'createWriteStream has been called with the filename');

    t.equal(fileStreamMock.write.callCount, 5, 'write has been called sufficient times');
    t.equal(fileStreamMock.write.getCall(0).args[0], '# oat-sa_extension-tao-foobar\n', 'writes the heading');
    t.equal(fileStreamMock.write.getCall(1).args[0], '\n## 1.2.3\n', 'writes the version subheading');
    t.equal(fileStreamMock.write.getCall(2).args[0], '\n- Fix: all bugs gone\n- Feature: blink tags everywhere\n', 'writes notes block 1');
    t.equal(fileStreamMock.write.getCall(3).args[0], '\n## 1.0.0\n', 'writes the version subheading');
    t.equal(fileStreamMock.write.getCall(4).args[0], '\n- Breaking: upgrade ActionScript\n', 'writes notes block 2');

    t.equal(fileStreamMock.end.callCount, 1, 'end has been called');
    t.ok(fileStreamMock.end.calledAfter(fileStreamMock.write), 'end was called last');

    createWriteStreamMock.resetHistory();
    sandbox.restore();
    t.end();
});

test('writeChangeLog function: csv', async (t) => {
    t.plan(8);

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

    t.equal(fileMock.write.callCount, 4, 'write has been called sufficient times');
    t.equal(fileMock.write.getCall(0).args[0], 'repo,version,release notes\n', 'writes header row');
    t.equal(fileMock.write.getCall(1).args[0], 'oat-sa_extension-tao-foobar,1.2.3,Fix: all bugs gone\n', 'writes row 1');
    t.equal(fileMock.write.getCall(2).args[0], 'oat-sa_extension-tao-foobar,1.2.3,Feature: blink tags everywhere\n', 'writes row 2');
    t.equal(fileMock.write.getCall(3).args[0], 'oat-sa_extension-tao-foobar,1.0.0,Breaking: upgrade ActionScript\n', 'writes row 3');

    t.equal(fileMock.end.callCount, 1, 'end has been called');

    createWriteStreamMock.resetHistory();
    sandbox.restore();
    t.end();
});
