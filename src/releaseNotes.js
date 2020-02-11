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

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const log = require('./log.js');
const io = require('./notes/io.js');
const requests = require('./notes/requests.js')();
const versioning = require('./notes/versioning.js');

let outputDir;
let data; // config file content


/**
 * Ensure the platform-safe unique output directory for the release notes is ready
 */
function setupOutputDir() {
    const ts = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    outputDir = path.join(process.cwd(), 'release_notes', ts);
    fs.ensureDirSync(outputDir);
}

/**
 * From 2 lists of composer dependencies, build the data structure which will hold
 * the list of all extensions with their name, starting and ending version
 * @param {Object} exts1
 * @param {Object} exts2
 * @returns {ExtensionRange[]}
 */
async function buildExtensionRanges(exts1, exts2) {
    let mergedKeys = await findAllKeys(exts1, exts2);

    /**
     * Stores the name, start and end versions of one extension
     * @typedef {Object} ExtensionRange
     * @example
     *   {
     *     repoName: 'oat-sa/extension-tao-devtools',
     *     startVersion: '1.2.3',
     *     endVersion: '1.4.6'
     *   }
     */
    return mergedKeys.map(key => ({
        repoName: key,
        startVersion: exts1[key],
        endVersion: exts2[key]
    }));
}

/**
 * Produce a list of all extension names to try, based on the provided start and end lists
 * @param {Object} exts1
 * @param {Object} exts2
 * @returns {Array}
 */
async function findAllKeys(exts1, exts2) {
    // Resolve and add tao-community extensions and versions
    exts1 = await expandTaoCommunity(exts1);
    exts2 = await expandTaoCommunity(exts2);

    const mergedKeys = Object.keys(Object.assign({}, exts1, exts2));

    log.done(`Ready to extract notes for ${mergedKeys.length} extensions.`);
    return mergedKeys;
}

/**
 * If the given extensions include tao-community, replace it with resolved list of extensions from the web
 * @param {Object} [extensions={}]
 * @returns {Object}
 */
async function expandTaoCommunity(extensions = {}) {
    const community = 'oat-sa/tao-community';

    if (Object.keys(extensions).includes(community)) {
        const tcVersion = extensions[community];
        const resolvedExtensions = await requests.resolveTaoCommunityComposer(tcVersion);
        Object.assign(extensions, resolvedExtensions);
        delete extensions[community];
        log.done(`Retrieved ${Object.keys(resolvedExtensions).length} extension versions for tao-community v${tcVersion}.`);
    }
    return extensions;
}

/**
 * Extract the release notes for one extension with a defined version range
 * @param {ExtensionRange} [extRange={}] - { repoName, startVersion, endVersion }
 * @param {Boolean} [autoVersions=false] - fill missing versions automatically
 * @returns {?} releaseNotes
 */
async function extractReleaseNotesRange(extRange = {}, autoVersions = false) {
    const { repoName } = extRange;
    let { startVersion, endVersion } = extRange;
    log.info(`\nBegin ${chalk.yellow(repoName)} : ${startVersion} -> ${endVersion}`);

    await requests.initStandaloneGithubClient(data.token, repoName);

    const pullRequests = await requests.fetchAllPullRequests();

    ({ startVersion, endVersion } = await versioning.defineVersions(startVersion, endVersion, pullRequests, autoVersions));
    if (!startVersion || !endVersion) {
        return [];
    }

    const filteredPullRequests = await requests.filterPullRequests(pullRequests, startVersion, endVersion);
    const releaseNotes = await requests.extractReleaseNotes(filteredPullRequests);
    return releaseNotes;
}

/**
 * Main routine
 * Downloads release notes for a single given extension. Versions are prompted for.
 * @param {String} extension - its github repo name
 */
async function downloadSingle(extension = '') {
    if (!extension.length) {
        log.exit(`Invalid extension: '${extension}'`);
    }
    // validate argument
    if (!extension.startsWith('oat-sa/')) {
        extension = `oat-sa/${extension}`;
    }

    data = await io.loadConfig();

    // prompt for start & end
    let releaseNotes = await extractReleaseNotesRange({ repoName: extension });

    if (releaseNotes && releaseNotes.length) {
        setupOutputDir();
        await io.writeChangeLog(extension, outputDir, releaseNotes);
    }
}

/**
 * Main routine
 * Downloads release notes for all defined extensions
 * Prompts for input file locations if not given as arguments
 * @param {String} [file1] - start composer.json
 * @param {String} [file2] - end composer.json
 * @param {Boolean} [autoVersions=false] - fill missing versions automatically
 */
async function downloadMultiple(file1, file2, autoVersions = false) {
    data = await io.loadConfig();

    const { exts1, exts2 } = (file1 && file2) ?
        await io.readComposerFiles({ file1, file2 }) :
        await io.getComposers();

    const extensionRanges = await buildExtensionRanges(exts1, exts2);

    setupOutputDir();

    // Loop over all the given extensions and extract their notes
    for (let extRange of extensionRanges) {
        const releaseNotes = await extractReleaseNotesRange(extRange, autoVersions);
        if (releaseNotes && releaseNotes.length) {
            await io.writeChangeLog(extRange.repoName, outputDir, releaseNotes);
        }
    }
    log.done('All notes fetched.');
    io.concatAllFiles(outputDir, 'all_notes.md');
}

// Wrap program logic in messages + error handler
async function wrap(internalLogic, ...args) {
    log.title('TAO Release Notes');

    try {
        await internalLogic(...args);
        log.done('Good job!');
    }
    catch (err) {
        log.error(err);
    }
}

// Export the 2 main partially-applied (wrapped) functions
module.exports = {
    downloadSingle: wrap.bind(null, downloadSingle),
    downloadMultiple: wrap.bind(null, downloadMultiple)
};
