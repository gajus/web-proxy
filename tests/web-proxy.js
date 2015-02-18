var chai = require('chai'),
    expect = chai.expect;

describe('DataStore.database', function () {
    // @todo
});

describe('DataStore.session', function () {
    var DataStore,
        dataStore;
    beforeEach(function () {
        DataStore = require('../src/data-store.js');
        DataStore = DataStore();
        dataStore = DataStore.session();
    });
    describe('.read()', function () {
        describe('when request cannot be found', function () {
            it('returns null', function () {
                expect(dataStore.read({method: 'get', url: 'foo'})).to.equal(null);
            });
        });
        describe('when request can be found', function () {
            it('returns response', function () {
                var request,
                    response = {};

                request = {
                    method: 'get',
                    url: 'foo'
                };

                dataStore.write(request, response);

                expect(dataStore.read(request)).to.equal(response);
            });
        });
    });
    describe('.write()', function () {
        describe('when identical request is written twice', function () {
            it('stores the latest value', function () {
                var request,
                    response1 = {},
                    response2 = {};

                request = {
                    method: 'get',
                    url: 'foo'
                };

                dataStore.write(request, response1);
                dataStore.write(request, response2);

                expect(dataStore.read(request)).to.equal(response2);
            });
        });
    });
});
