import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
import { ErrorPolicy, FetchPolicy } from "apollo-client";
import { GET_VAULTS } from './queries';

const defaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache" as FetchPolicy,
    errorPolicy: "ignore" as ErrorPolicy,
  },
  query: {
    fetchPolicy: "no-cache" as FetchPolicy,
    errorPolicy: "all" as ErrorPolicy,
  },
};
const MUMBAI_URL = 'https://api.thegraph.com/subgraphs/name/zeke-02/ramm-protocol-v1'

export const rammClient = new ApolloClient({
  uri: MUMBAI_URL,
  cache: new InMemoryCache(),
  defaultOptions: defaultOptions
})