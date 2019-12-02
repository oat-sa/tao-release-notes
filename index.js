#!/usr/bin/env node

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
 * Copyright (c) 2017-2019 Open Assessment Technologies SA;
 */

/**
 * CLI script entry point
 *
 * Long but linear process.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @author Ricardo Proenca <ricardo@taotesting.com>
 */

const updateNotifier = require('update-notifier');

const log = require('./src/log.js');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

const argv = require('minimist')(process.argv.slice(2));

const wwwUser = argv['www-user'] || 'www-data';
const extensions = require('./release_notes/extensions.json');

const release = require('./src/release')(wwwUser, extensions);

async function automaticExtraction(extension) {
    await release.selectExtension(extension);
    await release.initialiseGithubClient();
    await release.extractPullRequests();
    await release.selectStartVersion();
    await release.selectEndVersion();
    await release.filterPullRequests();
    await release.extractReleaseNotes();
    await release.writeChangeLog();
}

async function processExtensionsArray(extensions) {
    log.title('Processing extensions');

    for (const extension of extensions) {
        await automaticExtraction(extension);
    }
    log.done('Good job!');
}

async function releaseExtension() {
    try {
        log.title('TAO NCCER Release Notes');

        await release.loadConfig();
        await release.selectTaoInstance();
        await release.showExtensions();

        await processExtensionsArray(extensions);

    } catch (error) {
        log.error(error);
    }
}

releaseExtension();
