export const CREDIT_PACKAGES = [
    { id: "prod_SQkShxszzVfSea", name: "Small Pack", credits: 100, price: 5 },
    { id: "prod_SQkSMOMbFVZIqD", name: "Medium Pack", credits: 300, price: 12 },
    { id: "prod_SQkSemW9YYNuto", name: "Large Pack", credits: 700, price: 25 },
    { id: "prod_SQkSmmaeLkOgSY", name: "Extra Large Pack", credits: 1500, price: 45 },
  ];

export const SUBSCRIPTION_PLANS = [
    { id: "prod_SQkSzKD1bvmB7e", name: "Starter Plan", credits: 20000, price: 10, isSubscription: true },
    { id: "prod_SQkSDQBT6vs18R", name: "Pro Plan", credits: 40000, price: 20, isSubscription: true },
    { id: "prod_SQkSPecauChp8L", name: "Premium Plan", credits: 80000, price: 30, isSubscription: true },
  ];

export const ALL_PACKAGES = [...CREDIT_PACKAGES, ...SUBSCRIPTION_PLANS];