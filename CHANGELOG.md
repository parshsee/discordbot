
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
 
## [Unreleased]
 
Here we have upcoming changes that may or may not be included in the next release
 
### Additions
- Add ability to view, create, manage threads
- Add ability to view, create, manage scheduled events
- Add use of slash commands

### Changes
- Update to discord js version 14
- Change events command to focus on discords scheduled events function

### Fixes
 
## 2022-07-26
 
### Added
- Changelog
 
### Changed
- Removed full name being displayed under every response from bot, now shows the bot name instead
- Removed unsused test commands: args-info & ping

### Fixed
- Issue where some images sent by dailycute command were showing up as downloadable files instead of images
- Issue where bot was sporadically sending out birthday messages
 
## [1.0.0] - 2020-12-23
 
### Added
- Created and deployed discord bot w/ several commands
	- add
	- args-info
	- bday
	- bdays
	- claim
	- commands
	- dailycute
	- delete
	- event
	- events
	- freestuff
	- info
	- leaderboard
	- meme
	- ping
	- quote
	- quotes
	- twitch
	- stats
- Created MongoDB collection for handling information for several commands
	- bday
	- add/claim
	- event
	- leaderboard
	- quote
	- twitch

### Changed
 
### Fixed