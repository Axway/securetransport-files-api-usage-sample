"use strict";

let requests = require('request-promise');
let Promise = require('promise');
let urljoin = require('url-join');
let fs = require('fs');
let path = require('path');
let File = require('./file');
let FileError = require('nested-error-stacks');


function FilesAPI(url, username, password) {
    this.secureTransportUrl = url;
    this.username = username;
    this.password = password;
}

/**
 * Upload a file to SecureTransport.
 *
 * @param folder folder where to upload the file
 * @param filename the filename for the destination file
 * @param fileStream stream representing the file content
 * @param metadata metadata assigned to the file
 * @param callback callback
 */
function uploadStream(folder, filename, fileStream, metadata, callback) {
    return new Promise((resolve, reject) => {
        let request = requests.defaults({});
        let payload = {
            method: 'POST',
            json: true,
            formData: {
                custom_file: {
                    options: {
                        filename: filename
                    },
                    value: fileStream
                }
            },
            uri: urljoin(this.secureTransportUrl, '/api/v1.0/files/', folder),
            agentOptions: {
                rejectUnauthorized: false
            },
            auth: {
                user: this.username,
                pass: this.password
            }
        };

        request(payload)
            .then((body) => {
                if (typeof body === 'undefined') {
                    // SecureTransport does not return a response in case of an uploaded file
                    return new File(urljoin(this.secureTransportUrl, 'api/v1.0/files', folder, filename), filename, folder, 'FILE');
                } else {
                    // Response is not expected
                    reject(new FileError('Unexpected response received '));
                }
            })
            .then((file) => {
                if (typeof metadata !== 'undefined') {
                    // We have to assign metadata to the uploaded file
                    this.update(urljoin(folder, filename), metadata)
                        .then((metadata) => {
                            file.size = metadata.size;
                            file.type = metadata.isDirectory === 'true' ? 'DIRECTORY' : 'FILE';
                            for (const property in metadata) {
                                if (metadata.hasOwnProperty(property) && property.indexOf('.') === -1 || property.substr(0, 'stfs'.length) === 'stfs') {
                                    delete metadata[property];
                                }
                            }
                            file.metadata = metadata;
                            resolve(file);
                        })
                        .catch(err => {
                            reject(new FileError('Could not set metadata. ', err));
                        });
                } else {
                    resolve(file);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    }).nodeify(callback);
}

/**
 * Upload a file.
 *
 * @param folder location where to upload the file
 * @param full path to the file to upload
 * @param metadata JSON object representing custom metadata to be set to the file
 * @param callback callback
 */
function uploadFile(folder, file, metadata, callback) {
    return new Promise((resolve, reject) => {
        fs.exists(file, exists => {
            if (exists) {
                const filename = path.basename(file);
                this.uploadStream(folder, filename, fs.createReadStream(file), metadata, callback)
                    .then(data => {
                        resolve(data);
                    })
                    .catch(err => {
                        reject(err);
                    });
            } else {
                reject(new FileError(`File ${file} does not exist.`));
            }
        });
    }).nodeify(callback);
}

/**
 * Update a file assigning it custom metadata
 *
 * @param file relative path to the homefolder represneting the file
 * @param metadata JSON object represneting the metadata to be set
 * @param callback callback
 * @return JSON object represneting the metadata
 */
function update(file, metadata, callback) {
    return new Promise((resolve, reject) => {
        let request = requests.defaults({});
        let payload = {
            method: 'POST',
            json: true,
            body: metadata,
            uri: urljoin(this.secureTransportUrl, '/api/v1.0/files/', file),
            agentOptions: {
                rejectUnauthorized: false
            },
            auth: {
                user: this.username,
                pass: this.password
            }
        };

        request(payload)
            .then(data => {
                if (typeof data === 'undefined') {
                    let payload = {
                        method: 'GET',
                        json: true,
                        uri: urljoin(this.secureTransportUrl, '/api/v1.0/files/', file, '?status'),
                        agentOptions: {
                            rejectUnauthorized: false
                        },
                        auth: {
                            user: this.username,
                            pass: this.password
                        }
                    };

                    request(payload)
                        .then((data) => {
                            resolve(data);
                        })
                        .catch(err => {
                            reject(new FileError('Could not set metаdata', err));
                        });

                } else {
                    reject(new FileError('Unexpected response received' + data));
                }
            })
            .catch(err => {
                reject(new FileError('Could not set metаdata', err));
            });
    }).nodeify(callback);
}

function listFile(file) {
    return new Promise((resolve, reject) => {
        let payload = {
            method: 'GET',
            json: true,
            uri: urljoin(this.secureTransportUrl, '/api/v1.0/files/', file, '?status'),
            agentOptions: {
                rejectUnauthorized: false
            },
            auth: {
                user: this.username,
                pass: this.password
            }
        };
        let request = requests.defaults({});

        request(payload)
            .then((data) => {

                const listedFile = new File(urljoin(this.secureTransportUrl, '/api/v1.0/files/', file),
                    data.fileName,
                    file,
                    data.size,
                    data.isDirectory === 'true' ? 'DIRECTORY' : 'FILE');
                for (const property in data) {
                    if (data.hasOwnProperty(property) && property.indexOf('.') === -1 || property.startsWith('stfs')) {
                        delete data[property];
                    }
                }
                listedFile.metadata = data;
                resolve(listedFile);
            })
            .catch(err => {
                reject(new FileError('Could not list file ' + file, err));
            });
    });
}

/**
 * List a folder.
 *
 * @param folder folder
 * @param callback callback
 */
function listFolder(folder, callback) {
    return new Promise((resolve, reject) => {
        const request = requests.defaults({});
        const payload = {
            method: 'GET',
            json: true,
            uri: urljoin(this.secureTransportUrl, '/api/v1.0/files/', folder),
            agentOptions: {
                rejectUnauthorized: false
            },
            auth: {
                user: this.username,
                pass: this.password
            }
        };

        request(payload)
            .then(data => {
                if (Array.isArray(data.files)) {
                    let result = [];
                    data.files.forEach(file => {
                        result.push(new File(urljoin(this.secureTransportUrl, '/api/v1.0/files/', folder, file.fileName),
                            file.fileName,
                            folder,
                            file.size,
                            file.isDirectory === 'true' ? 'DIRECTORY' : 'FILE'));
                    });
                    resolve(result);
                } else {
                    reject(new FileError('Incorrect response received from server'));
                }
            })
            .catch(err => {
                reject(err);
            });
    }).nodeify(callback);
}

FilesAPI.prototype = {
    uploadFile: uploadFile,
    uploadStream: uploadStream,
    update: update,
    listFolder: listFolder,
    listFile: listFile
};

module.exports = FilesAPI;
