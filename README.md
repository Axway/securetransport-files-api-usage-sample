# securetransport-files [![NPM version][npm-image]][npm-url]
> SecureTransport Files API client

## Installation

```sh
$ npm install --save securetransport-files
```

## Usage

```js
'use strict';

const FilesAPI = require('securetransport-files');
const fs = require('fs');

const files = new FilesAPI('https://localhost:443', 'username', 'password');

files.uploadFile('/', 'LICENSE', {'test.property': 'alabala'})
    .then((data) => {
        console.log('File success', JSON.stringify(data));
    })
    .catch((err) => {
        console.log("Failed upload.", err);
    });

files.uploadFile('/', 'README.md', {'test.property': 'alabala'})
    .then((data) => {
        console.log('File success', JSON.stringify(data));
    })
    .catch((err) => {
        console.log("Failed upload.", err);
    });

files.uploadStream('/', 'gulpfile.js', fs.createReadStream('gulpfile.js'), {'a.test': 'test123'})
    .then((data) => {
        console.log('File success', JSON.stringify(data));
    })
    .catch((err) => {
        console.log("Failed upload.", err);
    });

files.listFolder('/')
    .then((data) => {
        console.log("Returned files ", JSON.stringify(data));
    })
    .catch((err) => {
        console.log("Failed to list folder.", err);
    });

files.listFile('/README.md')
    .then((data) => {
        console.log("Listed file ", JSON.stringify(data));
    })
    .catch((err) => {
        console.log("Failed to list file.", err);
    });
```
## License

Copyright (c) 2016 [Axway](http://axway.com) & licensed under the [Apache License](LICENSE).


[npm-image]: https://badge.fury.io/js/securetransport-files.svg
[npm-url]: https://npmjs.org/package/securetransport-files
