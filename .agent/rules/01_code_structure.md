# Code Structure and Refactoring Standards

## Core Principles
1. **Single Responsibility Principle (SRP)**: Each function, class, or file must have only one responsibility.
2. **Layer Separation**: Separate UI, business logic, data access, and external integrations (API, Playwright, Sheets).
3. **DRY (Don't Repeat Yourself)**: Extract common logic into shared functions or modules if it appears more than twice.
4. **Function Length**: Functions exceeding 30 lines or 3 levels of nesting should be refactored and decomposed.
5. **No Hardcoding**: URLs, selector strings, magic numbers, and configurations must be separated into constants or config files.

## Documentation and Context
- **File Headers**: Include a 3-8 line summary at the top of each file explaining its role, call relationships, and maintenance notes.
- **Docstrings**: Public functions/services must describe "Purpose / Input / Output / Side Effects (External Calls) / Exceptions".
- **Meaningful Naming**: Function names must clearly reflect their action.
