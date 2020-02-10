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
 * Copyright (c) 2018 Open Assessment Technologies SA;
 */

/**
 * Unit test the module src/validate.js
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

const test     = require('tape');
const validate = require('../../../src/validate.js');

test('the module api', t => {
    t.plan(1);
    t.ok(typeof validate === 'object', 'The module exports an object');
    t.end();
});

test('the githubToken method', t => {
    t.plan(12);

    t.ok(typeof validate.githubToken === 'function', 'The module expose a githubToken method');

    t.throws(() => validate.githubToken(), TypeError);
    t.throws(() => validate.githubToken(''), TypeError);
    t.throws(() => validate.githubToken('12'), TypeError);
    t.throws(() => validate.githubToken(12), TypeError);
    t.throws(() => validate.githubToken('AE'), TypeError);
    try {
        validate.githubToken('foo');
    } catch(err){
        t.equal(err.message, 'The Github token is missing or not well formatted, we expect a long hexa string.');
    }
    try {
        validate.githubToken('foo', 'Custom Message');
    } catch(err){
        t.equal(err.message, 'Custom Message');
    }

    t.doesNotThrow( () => validate.githubToken('01AF9E99BFE0'),'Upper case small token');
    t.doesNotThrow( () => validate.githubToken('01af9e99fe012a01'), 'Lower case small token');
    t.doesNotThrow( () => validate.githubToken('23acf5dd2087369942acef7a30b4c5e070ee0b79'), 'Real token');

    t.deepEqual(validate.githubToken('01af9e99fe012a01'), validate, 'The method chains');

    t.end();
});


test('the githubRepository method', t => {
    t.plan(11);

    t.ok(typeof validate.githubRepository === 'function', 'The module expose a githubRepository method');

    t.throws(() => validate.githubRepository(), TypeError);
    t.throws(() => validate.githubRepository(''), TypeError);
    t.throws(() => validate.githubRepository('foo'), TypeError);
    t.throws(() => validate.githubRepository('tao-core'), TypeError);
    t.throws(() => validate.githubRepository('git@github.com:tao-core.git'), TypeError);
    try {
        validate.githubRepository('foo');
    } catch(err){
        t.equal(err.message, 'The Github repository identifier is missing or not well formatted, we expect the short version org-name/repo-name.');
    }
    try {
        validate.githubRepository('foo', 'Custom Message');
    } catch(err){
        t.equal(err.message, 'Custom Message');
    }

    t.doesNotThrow( () => validate.githubRepository('oat-sa/tao-core'));
    t.doesNotThrow( () => validate.githubRepository('fooOrg/awsome-list_3'));

    t.deepEqual(validate.githubToken('01af9e99fe012a01'), validate, 'The method chains');

    t.end();
});
