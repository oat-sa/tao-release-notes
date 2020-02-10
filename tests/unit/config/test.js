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
 * Unit test the module src/config.js
 *
 */

const test = require('tape');
const config = require('../../../src/config.js');

test('API', t => {
    t.plan(4);

    t.ok(typeof config === 'function', 'The module exports a function');
    t.ok(typeof config() === 'object', 'The module function creates an object');
    t.ok(typeof config().load === 'function', 'The created object has a load method');
    t.ok(typeof config().write === 'function', 'The created object has a write method');

    t.end();
});
