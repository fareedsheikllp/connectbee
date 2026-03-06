export const PLANS = {
  trial:      { label: "Trial",      price: 0,      priceLabel: "Free",        conversations: 100,   flows: 1,           agents: 1  },
  starter:    { label: "Starter",    price: 99.99,  priceLabel: "$99.99/mo",   conversations: 1000,  flows: 3,           agents: 2  },
  growth:     { label: "Growth",     price: 149.99, priceLabel: "$149.99/mo",  conversations: 10000, flows: "Unlimited", agents: 10 },
  enterprise: { label: "Enterprise", price: null,   priceLabel: "Custom",      conversations: "∞",   flows: "Unlimited", agents: "∞"},
};