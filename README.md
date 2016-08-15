# redux-entity

This library is intended to make building large apps with redux easier.
 
Applications often evolve from relatively simple requirements (ie, grab data from a server and display it) to more complicated
requirements such as loading states, optimistic updates, offline caching, cache invalidation, complex validation, etc.

Such requirements carry with them a lot of nuance and corner cases that aren't always dealt with (especially if it's not a critical
feature). Moreover, the complexity of these requirements often lead to the code being much harder to understand and has a lot of
boilerplate that makes the core functionality of the code harder to understand.

My hope is that this library can act as a layer of abstraction around some of these issues, resulting in much cleaner and easier
to understand code without circumventing amy of the core principles around redux.

You can think of this library as one giant immutable data structure that was built specifically for the needs of common front-end
application scenarios.

## Features

I'm planning on adding a few things to this library to start, and see where needs develop in an actual application.

The features currently planned are:

- [x] Normalized Data Storage (ie, one source of truth)
- [x] Optimistic Updates
- [ ] Asynchronous Validation + Form State
- [ ] Offline first strategies (persisting state)
- [ ] System for making user-land plugins
- [ ] Add propType validators to `Schema` objects
- [ ] Allow `Schema` to specify base type: `Object | Map | Record`
- [ ] Move visiting logic to the `Schema` base class
- [ ] Take advantage of `reselect`
- [ ] Basic Query plugins
    - [ ] `SimpleList`
    - [ ] `PagedList`
    - [ ] `FilteredList`
    - [ ] `FilteredPagedList`


## Usage

You will want to start your app off by defining the "schema" of your app. Use `Schema` to create all of the different entities you care
about in your frontend. After creating them, you will want to define their relationships with one another. The relationships of these
schema is inspired from the [normalizr](https://github.com/paularmstrong/normalizr) library.

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

You should do all of the normal things you would do to set up [redux](https://github.com/reactjs/redux). When you do, you should create an `entities` reducer. (The name doesn't matter,
but will be the location of the state atom that holds all of the state related to your server-backed data.

The state controlled by your `entities` reducer is an instance of an immutable data structure `EntityStore`.  You will want to create the initial state by 
running `EntityStore.create` with all of the schemas you defined in the above file.

You will want to then create a reducer function and return a new `EntityStore` instance by using any number of the fluent prototype methods
that are provided.

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

Finally, when connecting with your React components, you will want to use one of the many getter prototype methods from your `EntityStore` state atom.

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
