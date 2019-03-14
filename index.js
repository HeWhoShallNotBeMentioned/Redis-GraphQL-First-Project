const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const redis = require('redis');
const bluebird = require('bluebird');

//import resolvers2 from './resolvers';
// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    get(key: String!): String
  }
  type Mutation {
    set(key: String!, value: String!): Boolean!
  }
`;
let client = redis.createClient();
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    get: (parent, { key }) => {
      try {
        return client.getAsync(key);
      } catch (e) {
        return null;
      }
    },
  },

  Mutation: {
    set: async (parent, { key, value }) => {
      try {
        await client.set(key, value);
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
  },
};

client.on('error', function(err) {
  console.log('Error ' + err);
});
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

const app = express();
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`));
