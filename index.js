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
 * Copyright (c) 2020 Open Assessment Technologies SA;
 */

/**
 * CLI script entry point
 */

const pkg = require('./package.json');
const updateNotifier = require('update-notifier');
updateNotifier({pkg}).notify();

const releaseNotes = require('./src/releaseNotes.js');

const commander = require('commander');
const program = new commander.Command();

program
    .version(pkg.version)
    .name('taoReleaseNotes')
    .usage('<composers|single> [options]');

/**
 * The most basic 'composers' command will prompt for the paths to the 2 composer.json files:
 * @usage taoReleaseNotes composers
 *
 * Optionally, the composer file locations can be passed as arguments:
 * @usage taoReleaseNotes composers --c1 composer1.json --c2 composer2.json
 */
program
    .command('composers')
    .option('--c1 <file>', 'Path to composer.json for start of range')
    .option('--c2 <file>', 'Path to composer.json for end of range')
    .option('-a, --autoVersions', 'Automatically fill any missing versions instead of prompting', true)
    .action(args => {
        if (args.c1 && args.c2) {
            releaseNotes.downloadMultiple(args.c1, args.c2, args.autoVersions);
        }
        else {
            releaseNotes.downloadMultiple(null, null, args.autoVersions);
        }
    });

/**
 * The 'single' command must be passed an extension repo name, it will prompt for the desired version range
 * @usage taoReleaseNotes single -e extension-tao-itemqti
 */
program
    .command('single')
    .option('-e, --extension <extension>', 'Repo name of an individual extension')
    .action(args => {
        releaseNotes.downloadSingle(args.extension);
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    // missing command
    program.help();
}