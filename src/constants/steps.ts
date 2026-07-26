export const RELEASE_STEPS = [
  { id: "step-1", label: "All relevant GitHub pull requests have been merged" },
  { id: "step-2", label: "CHANGELOG.md files have been updated" },
  { id: "step-3", label: "All tests are passing" },
  { id: "step-4", label: "Releases in Github created" },
  { id: "step-5", label: "Deployed in demo" },
  { id: "step-6", label: "Tested thoroughly in demo" },
  { id: "step-7", label: "Deployed in production" },
];

export function computeStatus(completedSteps: string[]): "Planned" | "Ongoing" | "Done" {
  if (!completedSteps || completedSteps.length === 0) return "Planned";
  if (completedSteps.length === RELEASE_STEPS.length) return "Done";
  return "Ongoing";
}