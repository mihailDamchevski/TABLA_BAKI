// Animation utilities

export const waitForAnimation = (callback: () => void, delay: number = 800): void => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(callback, delay);
    });
  });
};
