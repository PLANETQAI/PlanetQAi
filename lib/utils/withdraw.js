// utils/withdraw.js
export const canWithdrawPoints = (userPoints) => {
  const MIN_WITHDRAWAL_POINTS = 100; // $1.00
  return userPoints >= MIN_WITHDRAWAL_POINTS;
};

export const getWithdrawableAmount = (userPoints) => {
  const MIN_WITHDRAWAL_POINTS = 100;
  return Math.floor(userPoints / MIN_WITHDRAWAL_POINTS) * MIN_WITHDRAWAL_POINTS;
};

export const pointsToDollars = (points) => (points * 0.01).toFixed(2);