---
name: using-superpowers
description: Implements the Superpowers software development workflow. Use when starting a new feature, fixing a bug, or beginning any development task to ensure structured, test-driven, and plan-based execution.
---

# Superpowers Workflow

## When to use this skill
- When starting a new feature or project.
- When tasked with systematic debugging or refactoring.
- Whenever a structured plan or test-driven development (TDD) approach is needed.

## Workflow
The Superpowers methodology requires strictly following these sequential phases. Do not skip steps.

- [ ] **1. Brainstorming & Design**
    - Do not jump into writing code immediately.
    - Ask clarifying questions to understand the actual goal.
    - Output a specification in small, digestible chunks.
    - Wait for user validation and sign-off on the design.
- [ ] **2. Worktree & Environment Setup**
    - Isolate the work by creating a new Git branch (or worktree) if applicable.
    - Verify a clean test baseline before writing any code.
- [ ] **3. Writing Plans**
    - Break the agreed-upon design into bite-sized tasks (2-5 minutes of execution each).
    - For each task, list exact file paths, complete code objectives, and strict verification steps.
- [ ] **4. Test-Driven Development (TDD) & Execution**
    - Work task-by-task.
    - **RED-GREEN-REFACTOR**: Write a failing test first, run it to watch it fail, write minimal code to pass it, run it to watch it pass, then refactor.
    - **Evidence over claims**: Do not declare success without running the test.
- [ ] **5. Review & Finish**
    - Review the completed work against the original plan.
    - Present options to merge, PR, or discard the development branch.

## Instructions
- **Systematic over ad-hoc**: Follow processes over guessing.
- **Complexity reduction**: Make simplicity the primary goal. Keep code DRY and adhere to YAGNI (You Aren't Gonna Need It).
- **Subagent-Driven**: For complex tasks, consider executing smaller chunks individually and reviewing each result against the spec compliance and code quality.

## Resources
- [Superpowers GitHub Repository](https://github.com/obra/superpowers.git)
