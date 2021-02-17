'use strict';

const { TestDirector } = require('test-director');

const tests = new TestDirector();

require('./universal/GraphQL.test')(tests);
require('./universal/graphqlFetchOptions.test')(tests);
require('./universal/hashObject.test')(tests);
require('./universal/useGraphQL.test')(tests);

tests.run();
