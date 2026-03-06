import { useEffect, useState } from "react";

const DEFAULT_PLANS = {
  trial:      { label: "Trial",      priceLabel: "Free",       price: 0,      conversations: 100,    flows: 1,   agents: 1   },
  starter:    { label: "Starter",    priceLabel: "$99.99/mo",  price: 99.99,  conversations: 1000,   flows: 3,   agents: 2   },
  growth:     { label: "Growth",     priceLabel: "$149.99/mo", price: 149.99, conversations: 10000,  flows: 10,  agents: 10  },
  enterprise: { label: "Enterprise", priceLabel: "Custom",     price: 0,      conversations: 999999, flows: 999, agents: 999 },
};

export function usePlans() {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then(r => r.json())
      .then(d => {
        if (d.plans) setPlans(d.plans);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { plans, loading };
}