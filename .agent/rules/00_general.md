# General Execution Rules

This project follows strict engineering standards. All agents must read and comply with these rules before any action.

## Mandatory Behavior
1. **Rule Awareness**: Always read and comply with the rules in this directory before generating, modifying, or refactoring code.
2. **Standard Compliance**: When creating new code, follow structure, logging, security, and documentation rules.
3. **Change Transparency**: When modifying existing code, explain:
    - What changed
    - Why it changed
    - Impacted modules
4. **Documentation Synchronization**: When structure changes occur, update related documentation files (SYSTEM_DOCS.md, MAINTENANCE.md, etc.) accordingly.
5. **Conflict Resolution**: If rules conflict with a request, prioritize maintainability, security, and clarity.
6. **Visual Documentation**: When updating architecture, process, or deployment documents, include at least one Mermaid diagram.

## Documentation Style (CHB Style)
- **Structure**: Use top-level headers (#), Table of Contents, Section dividers (---), and Checklists (✅ / - [ ]).
- **Format**: Use tables and code blocks with language identifiers.
- **Mermaid Placement**: 
    - "## 아키텍처" -> "### 시스템 구조도" (flowchart/graph)
    - "## 운영/배포" -> "### 흐름도" (flowchart/sequenceDiagram)
- **Verification**: Include at least one "✅ 체크리스트" section for security/testing/deployment.
