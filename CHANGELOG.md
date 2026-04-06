# Changelog

## [1.2.0](https://github.com/qixing-jk/spicetify-playlist-labels/compare/v1.1.0...v1.2.0) (2026-04-06)


### Features

* **ui:** add media thumbnails to playlist label overflow menu ([e91b9c8](https://github.com/qixing-jk/spicetify-playlist-labels/commit/e91b9c86489b3d19a9e0dd215d0ccfb092f22983))
* **ui:** replace ellipsis overflow with interactive button ([9ed2f6a](https://github.com/qixing-jk/spicetify-playlist-labels/commit/9ed2f6aa450581d1dedf69e73511bdf02fff1b2e)), closes [#11](https://github.com/qixing-jk/spicetify-playlist-labels/issues/11)


### Bug Fixes

* **css:** restore original right-aligned playlist labels flow ([d629f13](https://github.com/qixing-jk/spicetify-playlist-labels/commit/d629f135e39f191e1f8438b02ffba3b851d5c66a))

## [1.1.0](https://github.com/qixing-jk/spicetify-playlist-labels/compare/v1.0.0...v1.1.0) (2025-09-28)


### Features

* add prettier formatting script to package.json ([48a7dfe](https://github.com/qixing-jk/spicetify-playlist-labels/commit/48a7dfea96dcd816025e29adfffa11191f6dd109))


### Bug Fixes

* **playlist:** handle errors when fetching playlist items ([#8](https://github.com/qixing-jk/spicetify-playlist-labels/issues/8)) ([b4b0561](https://github.com/qixing-jk/spicetify-playlist-labels/commit/b4b056167f1d7c321cbd5fbdc53135d7612c1d3c))

## [1.0.0](https://github.com/qixing-jk/spicetify-playlist-labels/compare/v0.1.1...v1.0.0) (2025-09-28)

### ⚠ BREAKING CHANGES

- **deps:** The Spicetify.Panel namespace and its related components and hooks have been removed.

### Bug Fixes

- **ci:** correct build script name in release PR
  workflow ([7c942a2](https://github.com/qixing-jk/spicetify-playlist-labels/commit/7c942a26a48462c101911011307cdecb82b7bf02))
- **playlist:** fetch metadata if image is
  missing ([#4](https://github.com/qixing-jk/spicetify-playlist-labels/issues/4)) ([24b1637](https://github.com/qixing-jk/spicetify-playlist-labels/commit/24b16376a1cf258842e56c106206a1f022d42a79))
- **playlist:** temporarily disable context menu to address crash
  issue ([3f4a612](https://github.com/qixing-jk/spicetify-playlist-labels/commit/3f4a6120e23f45970d8719b5da1b967fdb7cb043))

### Build System

- **deps:** update Spicetify type
  definitions ([2ca13be](https://github.com/qixing-jk/spicetify-playlist-labels/commit/2ca13befc68be5e6b768ec19d9b25b130bf78bc8))

### BREAKING CHANGES

- **deps:** The Spicetify.Panel namespace and its related
  components and hooks have been removed.

## [0.1.1](https://github.com/qixing-jk/spicetify-playlist-labels/compare/v0.1.0...v0.1.1) (2025-09-24)

### Bug Fixes

- **Compatible with Spicetify Stats App:** Avoid cluttering the Top Tracks page style in the Spicetify Stats
  App ([ca2daa4](https://github.com/qixing-jk/spicetify-playlist-labels/commit/ca2daa4bf5838b971d260912232e7c054d9c09a9))
- **tracklist:** fix track URI retrieval
  logic ([f00c799](https://github.com/qixing-jk/spicetify-playlist-labels/commit/f00c799442f1d63eef8b9fea8368cbfa2f0452d5))

### Features

- **utilties:** add functions to retrieve React Fiber nodes and parent
  props ([a201c59](https://github.com/qixing-jk/spicetify-playlist-labels/commit/a201c590f5ce7c2abd9cef307e66e2456471149e))

# [0.1.0](https://github.com/qixing-jk/spicetify-playlist-labels/compare/8ea21aaf172866d0517d7ccd49e441cc12c57dba...v0.1.0) (2024-08-20)

### Bug Fixes

- distorted playlist
  images ([54476ef](https://github.com/qixing-jk/spicetify-playlist-labels/commit/54476ef1030bcadaebc45876f5d2e30b033d2b37))
- labels not loading on
  startup ([8ea21aa](https://github.com/qixing-jk/spicetify-playlist-labels/commit/8ea21aaf172866d0517d7ccd49e441cc12c57dba))

### Features

- save toggle option and refactor
  button ([9871fdf](https://github.com/qixing-jk/spicetify-playlist-labels/commit/9871fdffd12f2bb3e408e367aa0ed823a2609648))

### Reverts

- Revert "Cache playlists data for faster
  startup" ([62badfa](https://github.com/qixing-jk/spicetify-playlist-labels/commit/62badfae7c11405cb28106cc94c4fe07c3c624ff))
- Revert "Fix caching
  bug" ([ea5c7b7](https://github.com/qixing-jk/spicetify-playlist-labels/commit/ea5c7b7367cfe9f898d889bc85484000208f7286))
