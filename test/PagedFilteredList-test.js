const { expect } = require('chai');
const { Schema, arrayOf, EntityStore, PagedFilteredList, Reference } = require('../src');

const REF = (schema, id) => new Reference(schema, id);

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

const SearchResults = new PagedFilteredList('searchResults', Listing);

describe('Resources', () => {
  describe('update(schema, data)', () => {
    it('stores data normalized', () => {
      let store = EntityStore.create({
        entities: [
          User,
          Listing,
          Reservation,
        ],
        resources: [
          SearchResults,
        ],
      });

      const page = 0;
      const filter = { id: 2 };
      const items = [
        {
          id: 1,
          title: 'Foo',
          host: {
            id: 2,
            name: 'John',
          },
        },
        {
          id: 3,
          title: 'Bar',
          host: {
            id: 4,
            name: 'James',
          },
        },
        {
          id: 5,
          title: 'Baz',
          host: {
            id: 2,
            name: 'John',
          },
        },
      ];

      store = store.for(SearchResults, state => state.setPage(filter, page, items));

      expect(store.getResource(SearchResults).getPage(filter, page)).to.eql([
        {
          id: 1,
          title: 'Foo',
          host: REF(User, 2),
        },
        {
          id: 3,
          title: 'Bar',
          host: REF(User, 4),
        },
        {
          id: 5,
          title: 'Baz',
          host: REF(User, 2),
        },
      ]);
    });
  });
});
