# redux-entity

## Features

I'm planning on adding a few things to this library to start, and see where needs develop in an actual application.

The features currently planned are:

- [x] Normalized Data Storage (ie, one source of truth)
- [x] Optimistic Updates
- [ ] Asyncronous Validation + Form State
- [ ] Offline first strategies (persisting state)
- [ ] System for making user-land plugins
- [ ] Add propType validators to `Schema` objects
- [ ] Allow `Schema` to specify base type: `Object | Map | Record`
- [ ] Move visiting logic to the `Schema` base class
- [ ] Basic Query plugins
    - [ ] `SimpleList`
    - [ ] `PagedList`
    - [ ] `FilteredList`
    - [ ] `FilteredPagedList`


## Usage

```js
// appSchema.js
import {
  Schema,
  arrayOf,
} from 'redux-entity';

export const User = new Schema('users');
export const Listing = new Schema('listings');
export const Reservation = new Schema('reservations');

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

```

```js
// reducers/entites.js

import { EntityStore } from 'redux-entity';
import { User, Listing, Reservation } from '../appSchema';

const initialState = EntityStore.create({
  entities: [
    Listing,
    User,
    Reservation,
  ],
});

export default function reducer(state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case USER_FETCH:
      return state.setIsLoading(User, payload.id, true);

    case USER_FETCH_SUCCESS:
      return state
        .update(User, payload)
        .setIsLoading(User, payload.id, false);
    
    case LISTING_FETCH:
      return state.setIsLoading(Listing, payload.id, true);

    case LISTING_FETCH_SUCCESS:
      return state
        .update(Listing, payload)
        .setIsLoading(Listing, payload.id, false);
    
    case UPDATE_LISTING_TITLE:
      return state
        .optimisticUpdate(Listing, payload.id, action.requestId, {
          title: payload.title,
        });

    case UPDATE_LISTING_TITLE_SUCCESS:
      return state
        .removeOptimisticUpdate(action.requestId)
        .update(Listing, payload);

    default: 
      return state;
  }
}

```

```js
// components/ListingContainer.js

import { connect } from 'react-redux';
import { Listing } from '../appSchema';
import ListingComponent from './ListingComponent';

function mapStateToProps({ entities }, props) {
  return {
    listing: entities.get(Listing, props.id),
    isLoading: entities.getIsLoading(Listing, props.id),
  };
}

export default connect(mapStateToProps)(ListingComponent);
```


## Inspiration and Sources

This project (still a work in progress) essentially started as a fork of [normalizr](https://github.com/paularmstrong/normalizr). The 
project was forked because data normalization is slowly going to become only a small feature of this library, and the
internals of the code has already changed a fair amount. The ideas and concepts behind this code are highly inspired
from the work on normalizr, and how to combine it with [redux](https://github.com/reactjs/redux) and [immutable](https://github.com/facebook/immutable-js) in an intelligent way that can reduce
the complexity of large modern code bases.
