"use strict";

function File(url, name, path, size, type, metadata) {
    this.url = url;
    this.name = name;
    this.path = path;
    this.type = type;
    this.size = size;
    this.metadata = metadata;
}

module.exports = File;
