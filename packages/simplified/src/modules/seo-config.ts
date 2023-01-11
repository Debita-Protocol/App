/*
 * Useful tips:
 *
 * HTML
 * Titles should have 50–60 characters. Reminder! The " | Augur" at the end of the title adds 8 characters
 * Descriptions can be any length, but Google generally truncates snippets to 155–160 characters
 *
 * Open Graph (OG)
 * Title should have 60-90 characters
 * Description should have around 200 characters
 * The recommended image size is 1200px x 627px and no more than 5MB
 * Two column's layout (image on the left, text on the right) can be achieved using images smaller than 400px x 209px
 *
 * Twitter Cards
 * https://developer.twitter.com/en/docs/tweets/optimize-with-cards/overview/markup
 * Title should have 70 characters
 * Description should have around 200 characters
 * Small image box should have at least 120×120 pixels and no more than 1MB
 * Full width image box should have at least 280 x 150 pixels and no more than 1MB
 */

export const COMMON_HEAD_TAGS = {
  title: "RAMM",
  description:
    "RAMM is a prediction market protocol built on the Ethereum blockchain. It allows you to forecast events and be rewarded for predicting them correctly.",
  ogTitle: "Decentralized Prediction Markets",
  ogDescription:
    ".",
  ogSiteName: "Decentralized Prediction Markets",
  ogUrl: "",
  ogImage: "favicon/ramm.png",
  ogLocale: "en_US",
  ogType: "article",
  articleTag: [
    "RAMM",
    "Prediction Markets",
    "Underwriting",
    "Decentralized Predictions", 
    "Market Predictions",
    "Vault",
    "Decentralized Underwriting",
    "Uncollateralized Lending",
    "Risk Pricing",
    "Pricing Risk",
    "Decentralized risk pricing"
  ],
  articlePublishedTime: "2019-01-07T00:00:01+00:00",
  articleModifiedTime: "2019-01-07T00:00:12+00:00",
  ogUpdatedTime: "2019-01-07T00:00:12+00:00",
  articlePublisher: "",
  articleSection: "Decentralized Underwriting",
  ogImageWidth: "1024",
  ogImageHeight: "640",
  ogImageAlt:
    ".",
  twitterCardType: "summary",
  twitterTitle: "Decentralized Prediction Markets",
  twitterDescription:
    ".",
  twitterImage: "favicon/ramm.png",
  twitterImageAlt:
    ",",
  twitterSite: "@ramm",
  twitterCreator: "@ramm",
  canonicalUrl: "",
};

const MARKETS_LIST_TITLE = "RAMM Instruments";
const MARKETS_LIST_DESCRIPTION =
  "Underwrite Every Kind of Instruments";

export const MARKETS_LIST_HEAD_TAGS = {
  ...COMMON_HEAD_TAGS,
  title: MARKETS_LIST_TITLE,
  ogTitle: MARKETS_LIST_TITLE,
  twitterTitle: MARKETS_LIST_TITLE,
  description: MARKETS_LIST_DESCRIPTION,
  ogDescription: MARKETS_LIST_DESCRIPTION,
  twitterDescription: MARKETS_LIST_DESCRIPTION,
  canonicalUrl: "",
};

const PORTFOLIO_TITLE = "Portfolio";
const PORTFOLIO_DESCRIPTION = "In your portfolio you can check your transactions, orders, liquidity and more.";

export const PORTFOLIO_HEAD_TAGS = {
  ...COMMON_HEAD_TAGS,
  title: PORTFOLIO_TITLE,
  ogTitle: PORTFOLIO_TITLE,
  twitterTitle: PORTFOLIO_TITLE,
  description: PORTFOLIO_DESCRIPTION,
  ogDescription: PORTFOLIO_DESCRIPTION,
  twitterDescription: PORTFOLIO_DESCRIPTION,
  canonicalUrl: "",
};
