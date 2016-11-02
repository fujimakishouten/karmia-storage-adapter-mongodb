/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/*jslint devel: true, node: true, nomen: true, stupid: true */
'use strict';



// Variables
const mongoose = require('mongoose'),
    schema = require('../schema/schema');
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
     * @constructs KarmiaStorageAdapterMongoDB
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
        self.name = self.config.name || self.config.table || self.config.table_name || 'storage';
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
     * Get model
     *
     * @param {Function} callback
     */
    model(callback) {
        const self = this;
        if (self.table) {
            return (callback) ? callback(self.table) : Promise.resolve(self.table);
        }

        try {
            self.table = self.connection.model(self.name);
        } catch (e) {
            if (e instanceof mongoose.Error.MissingSchemaError) {
                const options = {
                        timestamps: {
                            createdAt: 'created_at',
                            updatedAt: 'updated_at'
                        }
                    },
                    schema_model = new mongoose.Schema(schema, options);

                if (self.ttl) {
                    schema_model.index(options.timestamps.updatedAt, {
                        index: true,
                        expires: self.ttl
                    });
                }

                self.table = self.connection.model(self.name, schema_model);
            } else {
                return (callback) ? callback(e) : Promise.reject(e);
            }
        }

        return (callback) ? callback(null, self.table) : Promise.resolve(self.table);
    }

    /**
     * Get buffer length
     *
     * @param {Function} callback
     */
    count(callback) {
        const self = this;

        return self.model().then(function (model) {
            return model.count();
        }).then(function (result) {
            return (callback) ? callback(null, result) : Promise.resolve(result);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }

    /**
     * Update existing data
     *
     * @param {string} key
     * @param {*} value
     * @param {Function} callback
     */
    set(key, value, callback) {
        const self = this;

        return self.model().then(function (model) {
            return model.findOne({key: key}).then(function (data) {
                data = data || new model({key: key});
                data.value = value;

                return data.save();
            });
        }).then(function () {
            return (callback) ? callback() : Promise.resolve();
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }

    /**
     * Get data
     *
     * @param {string} key
     * @param {Function} callback
     */
    get(key, callback) {
        const self = this;

        return self.model().then(function (model) {
            return model.findOne({key: key});
        }).then(function (result) {
            const value = (result) ? result.value : null;

            return (callback) ? callback(null, value) : Promise.resolve(value);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }

    /**
     * Remove data
     *
     * @param {string} key
     * @param {Function} callback
     */
    remove(key, callback) {
        const self = this;

        return self.model().then(function (model) {
            return model.findOneAndRemove({key: key});
        }).then(function () {
            return (callback) ? callback() : Promise.resolve();
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
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
