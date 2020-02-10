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
 * Unit test the function resolveTaoCommunityComposer of the module src/notes/requests.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */

const test = require('tape');
const rewire = require('rewire');
const requestsFactory = rewire('../../../../../src/notes/requests.js');

requestsFactory.__set__('log', {
    doing: () => {},
    error: () => {}
});

const requests = requestsFactory();

test('the module api', t => {
    t.plan(2);
    t.ok(typeof requests === 'object', 'The module exports an object');
    t.ok(typeof requests.resolveTaoCommunityComposer === 'function', 'The requests object contains a resolveTaoCommunityComposer function');
    t.end();
});

test('returns data from tao-community', async t => {
    t.plan(1);
    const tcVersion = '0.121.0-alpha';
    const res = await requests.resolveTaoCommunityComposer(tcVersion);
    t.deepEqual(
        res,
        {
            "oat-sa/generis": "12.6.3",
            "oat-sa/tao-core": "40.7.2",
            "oat-sa/extension-tao-community": "7.2.0",
            "oat-sa/extension-tao-funcacl": "5.3.3",
            "oat-sa/extension-tao-dac-simple": "5.1.1",
            "oat-sa/extension-tao-testtaker": "7.2.2",
            "oat-sa/extension-tao-group": "6.2.1",
            "oat-sa/extension-tao-item": "10.2.0",
            "oat-sa/extension-tao-itemqti": "23.3.0",
            "oat-sa/extension-tao-itemqti-pci": "6.2.0",
            "oat-sa/extension-tao-itemqti-pic": "5.3.3",
            "oat-sa/extension-tao-test": "13.4.4",
            "oat-sa/extension-tao-testqti": "35.9.0",
            "oat-sa/extension-tao-outcome": "10.2.2",
            "oat-sa/extension-tao-outcomeui": "8.2.2",
            "oat-sa/extension-tao-outcomerds": "6.3.1",
            "oat-sa/extension-tao-outcomekeyvalue": "5.4.1",
            "oat-sa/extension-tao-outcomelti": "3.2.1",
            "oat-sa/extension-tao-delivery": "14.7.0",
            "oat-sa/extension-tao-delivery-rdf": "10.2.0",
            "oat-sa/extension-tao-lti": "11.3.0",
            "oat-sa/extension-tao-ltideliveryprovider": "10.1.4",
            "oat-sa/extension-tao-revision": "7.0.0",
            "oat-sa/extension-tao-mediamanager": "9.0.1",
            "oat-sa/extension-pcisample": "2.5.3",
            "oat-sa/extension-tao-backoffice": "4.1.2",
            "oat-sa/extension-tao-proctoring": "18.2.3",
            "oat-sa/extension-tao-clientdiag": "7.3.3",
            "oat-sa/extension-tao-eventlog": "2.5.0",
            "oat-sa/extension-tao-task-queue": "5.0.1",
            "oat-sa/extension-tao-testqti-previewer": "2.10.2"
        },
        'The remote composer was fully fetched!');
    t.end();
});
