# Performance, Testing, and Maintenance

## Testing and Data Hygiene
1. **Cleanup**: Delete temporary files, dummy data, downloads, and screenshots after testing.
2. **Isolation**: Separate test data from production data (different folders/accounts).

## Versioning and Change Tracking
1. **Meaningful Commits**: Commit in logical units with clear reasons.
2. **Changelog**: Maintain `CHANGELOG.md` for logic, schema, or selector changes.
3. **No Breaking Changes**: Provide migration paths when changing schemas or sheet structures.

## Maintenance and Documentation
1. **Mandatory Documents**:
    - `README.md` (Setup/Execution)
    - `SYSTEM_DOCS.md` (Architecture/Data Flow)
    - `RUNBOOK.md` (Operations/Troubleshooting)
    - `CHANGELOG.md` (Change history)
    - `MAINTENANCE.md` (Maintenance guidelines)
2. **MAINTENANCE.md Content**:
    - Dependency list with versions
    - Environment setup (.env structure)
    - Deployment and Rollback procedures
    - API change response procedures
3. **Technical Debt**: Explicitly document and track TODOs and temporary hacks.
