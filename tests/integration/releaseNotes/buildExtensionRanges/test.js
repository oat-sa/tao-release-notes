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
 * Integration test of part of the module src/releaseNotes.js
 * -> buildExtensionRanges
 *   -> findAllKeys
 *     -> expandTaoCommunity
 *       -> requests.resolveTaoCommunityComposer
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const releaseNotes = rewire('../../../../src/releaseNotes.js');

// Private functions under test:
const buildExtensionRanges = releaseNotes.__get__('buildExtensionRanges');
const findAllKeys = releaseNotes.__get__('findAllKeys');
const expandTaoCommunity = releaseNotes.__get__('expandTaoCommunity');

const logMock = {
    doing: () => {},
    info: () => {},
    done: () => {},
    error: () => {}
};
releaseNotes.__set__('log', logMock);

test('the module api', t => {
    t.plan(3);
    t.ok(typeof buildExtensionRanges === 'function', 'The buildExtensionRanges function exists');
    t.ok(typeof findAllKeys === 'function', 'The findAllKeys function exists');
    t.ok(typeof expandTaoCommunity === 'function', 'The expandTaoCommunity function exists');
    t.end();
});

test('it builds extension ranges', async t => {
    t.plan(4);
    const exts1 = {
        "oat-sa/extension-tao-group": "^6.0.0",
        "oat-sa/extension-tao-item": "^10.0.0",
        "oat-sa/extension-tao-devtools": "~6.0.0"
    };
    const exts2 = {
        "oat-sa/tao-community": "0.121.0-alpha" // devtools is not defined within it
    };

    const ary = await buildExtensionRanges(exts1, exts2);
    const strings = ary.map(item => item.toString());

    t.notOk(ary.find(item => item.repoName === 'oat-sa/tao-community'), 'tao-community is not in the merged array');
    t.ok(strings.includes({ repoName: 'oat-sa/extension-tao-group', startVersion: '^6.0.0', endVersion: '6.2.1' }.toString()), 'taoGroups has correct range');
    t.ok(strings.includes({ repoName: 'oat-sa/extension-tao-item', startVersion: '^10.0.0', endVersion: '10.2.0' }.toString()), 'taoItems has correct range');
    t.ok(strings.includes({ repoName: 'oat-sa/extension-tao-devtools', startVersion: '~6.0.0', endVersion: undefined }.toString()), 'taoDevTools has correct range');

    t.end();
});
