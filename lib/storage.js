/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



/**
 * KarmiaStorageAdapterMongoDBStorage
 *
 * @class
 */
class KarmiaStorageAdapterMongoDBStorage {
    /**
     * Constructor
     *
     * @param {Object} connection
     * @param {Object} model
     * @param {Object} options
     * @constructs KarmiaStorageAdapterMongoDBStorage
     */
    constructor(connection, model, options) {
        const self = this;
        self.connection = connection;
        self.model = model;
        self.config = options || {};

        self.ttl = self.config.ttl || 0;
    }

    /**
     * Get buffer length
     *
     * @param {Function} callback
     */
    count(callback) {
        const self = this;

        return self.model.count().then(function (result) {
            return (callback) ? callback(null, result) : Promise.resolve(result);
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

        return self.model.findOne({key: key}).then(function (result) {
            const value = (result) ? result.value : null;

            return (callback) ? callback(null, value) : Promise.resolve(value);
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

        return self.model.findOne({key: key}).then(function (data) {
            data = data || new self.model({key: key});
            data.value = value;

            return data.save();
        }).then(function () {
            return (callback) ? callback() : Promise.resolve();
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

        return self.model.findOneAndRemove({key: key}).then(function () {
            return (callback) ? callback() : Promise.resolve();
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }
}


// Export module
module.exports = function (connection, model) {
    return new KarmiaStorageAdapterMongoDBStorage(connection, model);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

