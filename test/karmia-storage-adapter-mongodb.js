/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/*jslint node: true, nomen: true */
/*global beforeEach, describe, it */
'use strict';



// Variables
const expect = require('expect.js'),
    fixture = require('./resource/fixture'),
    adapter = require('../'),
    options = {
        host: 'localhost',
        port: 27017,
        database: 'karmia_storage_adapter_mongodb'
    };


describe('karmia-storage-adapter-mongodb', function () {
    describe('getConnection', function () {
        it('Should not get connection', function (done) {
            const storages = adapter(options);
            expect(storages.getConnection()).to.be(undefined);

            done();
        });

        it('Should get connection', function (done) {
            const storages = adapter(options);
            storages.connect().then(function () {
                const connection = storages.getConnection();
                expect(connection.constructor.name).to.be('NativeConnection');

                done();
            });
        });

        it('Should get existing connection', function (done) {
            const connection = {name: 'TEST_CONNECTION'},
                storages = adapter(options, connection);

            expect(storages.getConnection()).to.be(connection);

            done();
        });
    });

    describe('connect', function () {
        describe('Should connect to database', function () {
            it('Promise', function (done) {
                const storages = adapter(options);
                storages.connect().then(function () {
                    const connection = storages.getConnection();
                    expect(connection.constructor.name).to.be('NativeConnection');

                    done();
                }).catch(function (error) {
                    done(error);
                });
            });

            it('Callback', function (done) {
                const storages = adapter(options);
                storages.connect(function () {
                    const connection = storages.getConnection();
                    expect(connection.constructor.name).to.be('NativeConnection');

                    done();
                });
            });
        });
    });

    describe('disconnect', function () {
        describe('Should disconnect from database', function () {
            describe('Connected', function () {
                it('Promise', function (done) {
                    const storages = adapter(options);
                    storages.connect().then(function () {
                        return storages.disconnect();
                    }).then(function (result) {
                        expect(result).to.be(undefined);

                        done();
                    }).catch(done);
                });

                it('Callback', function (done) {
                    const storages = adapter(options);
                    storages.connect().then(function () {
                        storages.disconnect(function (error, result) {
                            if (error) {
                                return done(error);
                            }

                            expect(result).to.be(undefined);

                            done();
                        });
                    });
                });
            });

            describe('Not connected', function () {
                it('Promise', function (done) {
                    const storages = adapter(options);
                    storages.disconnect().then(function (result) {
                        expect(result).to.be(undefined);

                        done();
                    }).catch(done);
                });

                it('Callback', function (done) {
                    const storages = adapter(options);
                    storages.disconnect(function (error, result) {
                        if (error) {
                            return done(error);
                        }

                        expect(result).to.be(undefined);

                        done();
                    });
                });
            });
        });
    });

    describe('storage', function () {
        const storages = adapter(options),
            name = 'user';

        before(function (done) {
            storages.connect().then(function () {
                const storage = storages.storage(name);

                return fixture.reduce(function (promise, data) {
                    return promise.then(function () {
                        return storage.set(data.key, data.value);
                    });
                }, Promise.resolve());
            }).then(function () {
                done();
            }).catch(done);
        });

        after(function (done) {
            const connection = storages.getConnection(),
                parallels = Object.keys(connection.collections).map(function (key) {
                    return new Promise(function (resolve, reject) {
                        connection.collections[key].drop(function (error, result) {
                            return (error) ? reject(error) : resolve(result);
                        });
                    });
                });

            Promise.all(parallels).then(function () {
                done();
            }).catch(function (error) {
                done(error);
            });
        });

        describe('count', function () {
            describe('Should count items', function () {
                it('Promise', function (done) {
                    const storage = storages.storage(name);
                    storage.count().then(function (result) {
                        expect(result).to.be(9);

                        done();
                    }).catch(done);
                });

                it('Callback', function (done) {
                    const storage = storages.storage(name);
                    storage.count(function (error, result) {
                        if (error) {
                            return done(error);
                        }

                        expect(result).to.be(9);

                        done();
                    });
                });
            });
        });

        describe('get', function () {
            it('Promise', function (done) {
                const storage = storages.storage(name),
                    data = fixture[0];
                storage.get(data.key).then(function (result) {
                    expect(result).to.be(data.value);

                    done();
                }).catch(done);
            });

            it('Callback', function (done) {
                const storage = storages.storage(name),
                    data = fixture[0];
                storage.get(data.key, function (error, result) {
                    if (error) {
                        return done(error);
                    }

                    expect(result).to.be(data.value);

                    done();
                });
            });
        });

        describe('set', function () {
            it('Promise', function (done) {
                const storage = storages.storage(name),
                    key = 10,
                    value = 'Yukiho Kosaka';

                storage.get(key).then(function (result) {
                    expect(result).to.be(null);

                    return storage.set(key, value);
                }).then(function () {
                    return storage.get(key);
                }).then(function (result) {
                    expect(result).to.be(value);

                    return storage.remove(key);
                }).then(function () {
                    done();
                }).catch(done);
            });

            it('Callback', function (done) {
                const storage = storages.storage(name),
                    key = 10,
                    value = 'Yukiho Kosaka';

                storage.get(key, function (error, result) {
                    if (error) {
                        return done(error);
                    }

                    expect(result).to.be(null);

                    storage.set(key, value, function (error) {
                        if (error) {
                            return done(error);
                        }

                        storage.get(key, function (error, result) {
                            if (error) {
                                return done(error);
                            }

                            expect(result).to.be(value);

                            storage.remove(key, done);
                        })
                    });
                });
            });
        });

        describe('remove', function () {
            it('Promise', function (done) {
                const storage = storages.storage(name),
                    key = 10,
                    value = 'Yukiho Kosaka';

                storage.set(key, value).then(function () {
                    return storage.get(key);
                }).then(function (result) {
                    expect(result).to.be(value);

                    return storage.remove(key);
                }).then(function (result) {
                    expect(result).to.be(undefined);

                    return storage.get(key);
                }).then(function (result) {
                    expect(result).to.be(null);

                    done();
                })
            });

            it('Callback', function (done) {
                const storage = storages.storage(name),
                    key = 10,
                    value = 'Yukiho Kosaka';

                storage.set(key, value, function (error) {
                    if (error) {
                        return done(error);
                    }

                    storage.get(key, function (error, result) {
                        if (error) {
                            return done(error);
                        }

                        expect(result).to.be(value);

                        storage.remove(key, function (error, result) {
                            if (error) {
                                return done(error);
                            }

                            expect(result).to.be(result);

                            storage.get(key, function (error, result) {
                                if (error) {
                                    return done(error);
                                }

                                expect(result).to.be(null);

                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

