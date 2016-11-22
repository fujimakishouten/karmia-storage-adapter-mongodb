/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const mongoose = require('mongoose'),
    definition = require('../schema/schema'),
    storage = require('./storage');
mongoose.Promise = global.Promise;


/**
 * KarmiaStorageAdapterMongoDB
 *
 * @class
 */
class KarmiaStorageAdapterMongoDB {
    /**
     * Constructor
     *
     * @param {Object} options
     * @param {Object} connection
     * @constructs KarmiaDatabaseAdapterMongoDB
     */
    constructor(options, connection) {
        const self = this;
        self.config = options || {};

        self.host = self.config.host || 'localhost';
        self.port = self.config.port || 27017;
        self.database = self.config.database || self.config.keyspace;
        self.options = self.config.options || {};
        self.username = self.config.username || self.options.username || self.config.user || self.options.user;
        self.password = self.config.password || self.options.password || self.config.pass || self.options.pass;
        self.ttl = self.config.ttl || 0;
        if (connection) {
            self.connection = connection;
        }
    }

    /**
     * Get connection
     *
     * @returns {Object}
     */
    getConnection() {
        const self = this;

        return self.connection;
    }

    /**
     * Connect to database
     *
     * @param   {Function} callback
     */
    connect(callback) {
        const self = this;
        if (self.connection) {
            return (callback) ? callback() : Promise.resolve();
        }

        const options = Object.assign({}, self.options);
        self.connection = mongoose.createConnection();
        options.user = self.username;
        options.pass = self.password;

        if (callback) {
            return self.connection.open(self.host, self.database, self.port, options, callback);
        }

        return self.connection.open(self.host, self.database, self.port, options);
    }

    /**
     * Disconnect from database
     *
     * @param {Function} callback
     */
    disconnect(callback) {
        const self = this;
        if (self.connection) {
            return (callback) ? self.connection.close(callback) : self.connection.close();
        }

        return (callback) ? callback() : Promise.resolve();
    }

    /**
     * Get table
     *
     * @param   {string} name
     * @param   {Object} options
     * @returns {Object}
     */
    storage(name, options) {
        const self = this;
        self.storages = self.storages || {};
        if (self.storages[name]) {
            return self.storages[name];
        }

        const parameters = Object.assign({}, options || {}),
            ttl = parameters.ttl || self.ttl || 0,
            timestamps = {
                createdAt: 'created_at',
                updatedAt: 'updated_at'
            };
        parameters.timestamps = ('timestamps' in parameters) ? parameters.timestamps : timestamps;

        const schema = new mongoose.Schema(definition, parameters);
        if (ttl) {
            schema.index(parameters.timestamps.updatedAt, {
                index: true,
                expires: ttl
            });
        }

        const model = self.connection.model(name, schema);
        self.storages[name] = storage(self.connection, model, {ttl: ttl});

        return self.storages[name];
    }
}


// Export module
module.exports = function (options, connection) {
    return new KarmiaStorageAdapterMongoDB(options || {}, connection);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

