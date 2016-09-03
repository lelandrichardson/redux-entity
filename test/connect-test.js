const { expect } = require('chai');
const {
  Schema,
  arrayOf,
  EntityStore,
  FilteredList,
  ql,
  resolve,
} = require('../src');

const User = new Schema('user', {
  id: user => user.id,
});

const Listing = new Schema('listing', {
  id: listing => listing.id,
});

const Reservation = new Schema('reservation', {
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

const SearchResults = new FilteredList('searchResults', Listing);

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

store = store.update(arrayOf(Listing), items);
store = store.for(SearchResults, state =>
  state
    .setItems({ abc: 'abc' }, items)
    .setIsLoading({ abc: 'abc' }, false)
);

describe('graphQL Resolution', () => {
  it('can handle a simple get query', () => {
    const query = ql`
      {
        user(id: $id) {
          id
          name
        }
      }
    `;

    // resolver, document, rootValue, context?, variables?
    const result = resolve(store, query, { id: 2 });
    expect(result).to.eql({
      user: {
        id: 2,
        name: 'John',
      },
    });
  });

  it('can handle a get query with nested object', () => {
    const query = ql`
      {
        listing(id: $id) {
          id
          title
          host {
            id
            name
          }
        }
      }
    `;

    // resolver, document, rootValue, context?, variables?
    const result = resolve(store, query, { id: 1 });
    expect(result).to.eql({
      listing: {
        id: 1,
        title: 'Foo',
        host: {
          id: 2,
          name: 'John',
        },
      },
    });
  });

  it('can do multiple top level get queries', () => {
    const query = ql`
      {
        a: listing(id: $a) {
          id
          title
          host {
            id
            name
          }
        }
        b: listing(id: $b) {
          id
          title
          host {
            id
            name
          }
        }
      }
    `;

    // resolver, document, rootValue, context?, variables?
    const result = resolve(store, query, { a: 1, b: 3 });
    expect(result).to.eql({
      a: {
        id: 1,
        title: 'Foo',
        host: {
          id: 2,
          name: 'John',
        },
      },
      b: {
        id: 3,
        title: 'Bar',
        host: {
          id: 4,
          name: 'James',
        },
      },
    });
  });

  it('can query resources', () => {
    const filter = { abc: 'abc' };
    const query = ql`
      {
        searchResults(filter: $filter) {
          loading
          items {
            id
            title
          }
        }
      }
    `;

    // resolver, document, rootValue, context?, variables?
    const result = resolve(store, query, { filter });
    expect(result).to.eql({
      searchResults: {
        loading: false,
        items: [
          {
            id: 1,
            title: 'Foo',
          },
          {
            id: 3,
            title: 'Bar',
          },
          {
            id: 5,
            title: 'Baz',
          },
        ],
      },
    });
  });
});
