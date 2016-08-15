const { expect } = require('chai');
const { Schema, arrayOf, EntityStore } = require('../src');

const User = new Schema('users', {
  id: user => user.id,
});

const Listing = new Schema('listings', {
  id: listing => listing.id,
});

const Reservation = new Schema('reservations', {
  id: listing => listing.id,
});


Listing.define({
  host: User,
});

User.define({
  listings: arrayOf(Listing),
  reservations: arrayOf(Reservation),
});

Reservation.define({
  host: User,
  guest: User,
  listing: Listing,
});

describe('EntityStore', () => {
  describe('EntityStore.create(options)', () => {

  });

  describe('.get(schema, id)', () => {
    it('returns an entity after ', () => {
      let store = EntityStore.create({
        entities: [
          User,
          Listing,
          Reservation,
        ],
      });
      const listing = { id: 1, foo: 'bar' };
      store = store.update(Listing, listing);
      expect(store.get(Listing, 1)).to.eql(listing);
    });
  });

  describe('(Optimistic Updates)', () => {
    it('works', () => {
      let store = EntityStore.create({
        entities: [
          User,
        ],
      });
      const user = { id: 1, foo: 'bar', boo: 'bax' };
      store = store.update(User, user);
      store = store.addOptimisticUpdate(
        User,
        user.id,
        1,
        { foo: 'bam', qoo: 'qux' }
      );
      expect(store.get(User, 1)).to.eql({
        id: 1,
        foo: 'bam',
        boo: 'bax',
        qoo: 'qux',
      });
      store = store.addOptimisticUpdate(
        User,
        user.id,
        2,
        { boo: 'bop' }
      );
      expect(store.get(User, 1)).to.eql({
        id: 1,
        foo: 'bam',
        boo: 'bop',
        qoo: 'qux',
      });
      store = store.removeOptimisticUpdate(User, user.id, 2);
      expect(store.get(User, 1)).to.eql({
        id: 1,
        foo: 'bam',
        boo: 'bax',
        qoo: 'qux',
      });
      store = store.removeOptimisticUpdate(User, user.id, 1);
      expect(store.get(User, 1)).to.eql({
        id: 1,
        foo: 'bar',
        boo: 'bax',
      });
    });
  });

  describe('update(schema, data)', () => {
    it('stores data normalized', () => {
      let store = EntityStore.create({
        entities: [
          User,
          Listing,
          Reservation,
        ],
      });

      store = store.update(Listing, {
        id: 1,
        foo: 'bar',
        host: {
          id: 2,
          foo: 'baz',
        },
      });

      expect(store.get(Listing, 1)).to.eql({
        id: 1,
        foo: 'bar',
        host: 2,
      });

      expect(store.get(User, 2)).to.eql({
        id: 2,
        foo: 'baz',
      });
    });
  });
});
