# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.1.0] - 2026-02-15
### Added
- **Responsive Layout**: Applied `auto-fit` grid system and text wrapping for better mobile experience.
- **Secure Setup**: Added `setup_env.ps1` for secure API key injection on Windows.
- **New Persona**: Updated AI Coach persona to "Bang-guseok Yeopo" (Room Corner Lu Bu).

### Changed
- **AI Model**: Upgraded from `gemini-1.5-flash` to `gemini-2.0-flash` to resolve API errors.
- **Documentation**: Updated `README.md` and `SYSTEM_DOCS.md` with new deployment instructions and persona details.
- **API Key Handling**: Removed hardcoded API key from source code; now uses environment variables only.

### Fixed
- **Mobile UI**: Fixed button overlap and text clipping issues on small screens.
- **Windows Deployment**: Resolved `WinError 10048` (Port Conflict) and `ModuleNotFoundError`.
- **API Security**: Prevented API key leakage by adding `.env` and `setup_env.ps1` to `.gitignore`.

## [1.0.0] - 2026-02-14
### Added
- Initial release of Devil Town Running Coach website.
- Features: Skull Dice Game, AI Coach Chat, Schedule, Archive, Mixes.
