export function createValidation<
  const T extends Record<string, readonly string[]>,
  const R extends Record<string, string>,
>(config: T, rules: R): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, ruleKeys] of Object.entries(config)) {
    for (const rule of ruleKeys) {
      const name = `${key}_${rule}`;
      if (rules[rule]) {
        result[name] = rules[rule];
      }
    }
  }
  return result;
}
