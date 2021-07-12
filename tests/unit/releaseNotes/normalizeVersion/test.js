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
 * Copyright (c) 2021 Open Assessment Technologies SA;
 */

/**
 * Unit test the function normalizeVersion of the module src/releaseNotes.js
 *
 * @author Andrey Shaveko <andrey.shaveko@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const releaseNotes = rewire('../../../../src/releaseNotes.js');

// Private function under test:
const normalizeVersion = releaseNotes.__get__('normalizeVersion');

test('version normalization', t => {
    t.plan(3);
    t.ok(typeof normalizeVersion === 'function', 'The normalizeVersion function exists');
    t.ok(normalizeVersion('v0.1.1-alpha') === 'v0.1.1-alpha', 'leading `v` is not added if exists');
    t.ok(normalizeVersion('0.1.1-alpha') === 'v0.1.1-alpha', 'leading `v` is added if does not exist');
    t.end();
});
