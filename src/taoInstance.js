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
 * This module contains methods to retrieve info and data from a TAO instance.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @author Ricardo Proenca <ricardo@taotesting.com>
 */

const fs                      = require('fs');
const { normalize, basename } = require('path');

/**
 * Get the taoInstance
 *
 * @param {String} rootDir - the path of the TAO instance root
 * @param {Boolean} [quiet = true] - if we redirect stdout and stderr to the console
 * @param {String} [wwwUser = www-data] - the user with web server rights
 * @return {Promise} resolves with a result object
 */
module.exports = function taoInstanceFactory(rootDir = '') {

    return {

        /**
         * Check if the given directory is the root of a TAO instance
         * @param {String} [dir] - the path of the directory to check
         * @return {Promise} resolves with a result object
         */
        isRoot(dir = rootDir) {
            return new Promise((resolve, reject) => {
                const result = {
                    dir,
                    root : false
                };
                fs.lstat(dir, (err, stats) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!stats.isDirectory()) {
                        return reject(new Error(`${dir} must be a valid directory`));
                    }

                    fs.readdir(dir, (err, files) => {
                        if (err) {
                            return reject(err);
                        }
                        result.root = files.length &&
                            files.indexOf('tao') > -1 &&
                            files.indexOf('generis') > -1 &&
                            files.indexOf('index.php') > -1 &&
                            files.indexOf('config') > -1;
                        resolve(result);
                    });
                });
            });
        },

        /**
         * Check if the given TAO instance is installed
         * @returns {Promise<Boolean>}
         */
        isInstalled(){
            const installFile =  normalize(`${rootDir}/tao/views/locales/en-US/messages.json`);

            return new Promise( resolve => {
                fs.access(installFile, fs.constants.R_OK, err => {
                    if (err) {
                        return resolve(false);
                    }
                    return resolve(true);
                });
            });
        },

        /**
        * Check if the given name is an extension of the TAO instance
        * @param {String} extensionName - the name to verify
        * @return {Promise} resolves with a results object
        */
        isExtension(extensionName) {
            const extensionPath = normalize(`${rootDir}/${extensionName}`);
            return new Promise( (resolve, reject) => {
                fs.lstat(extensionPath, (err, stats) => {
                    const result = {
                        dir : extensionPath,
                        extension : false
                    };
                    if (err) {
                        return reject(err);
                    }
                    if (stats.isDirectory()) {
                        fs.readdir(extensionPath, (err, files) => {
                            if (err) {
                                return reject(err);
                            }
                            result.extension = files.length && files.indexOf('manifest.php') > -1;
                            resolve(result);
                        });
                    } else {
                        resolve(result);
                    }
                });
            });
        },

        /**
         * Get the extension list of the current instance
         *
         * @return {Promise} resolves with the list of extensions
         */
        getExtensions(){
            return new Promise( (resolve, reject) => {
                fs.readdir(rootDir, (err, files) => {
                    if (err) {
                        return reject(err);
                    }

                    Promise
                        .all(files.map( file => this.isExtension(file)))
                        .then(results => {
                            resolve(
                                results
                                    .filter( entry => entry.extension)
                                    .map( entry => basename(entry.dir) )
                            );
                        })
                        .catch( err => reject(err) );
                });
            });
        },

        /**
         * Extract the repository name from the extension composer
         * @param {String} extensionName - the name of the extension
         * @returns {Promise} resolves with the repo name
         */
        getRepoName(extensionName = ''){
            const composerPath = normalize(`${rootDir}/${extensionName}/composer.json`);
            return new Promise( (resolve, reject) => {
                fs.readFile(composerPath, 'utf-8', (err, data) => {
                    var fileData;
                    if(err){
                        return reject(err);
                    }
                    try{
                        fileData = JSON.parse(data);
                    } catch(jsonErr){
                        return reject(jsonErr);
                    }
                    return resolve(fileData.name);
                });
            });
        },
    };
};
