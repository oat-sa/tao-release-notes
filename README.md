# tao-release-notes

A CLI tool for extracting release notes from Github repos

## Project setup

```sh
npm install
```

## Prerequisites

- Github account

The first time the tool is run, it requires a Github Personal Access Token to be manually installed. The tool will prompt you to create one by opening https://github.com/settings/tokens. This token needs `repo` rights.

## Running the tool

The tool has 3 modes, specified by the command line options.

### 1. Composers mode - specify 2 local files when prompted

```sh
taoReleaseNotes composers
```

You will be prompted for the paths to 2 `composer.json` files (local to the current working directory). The composers can contain flat lists of extensions, and can also reference `tao-community` versions. If `tao-community` is included in your composer, the version will be looked up online and its dependencies will be added to the parent composer for the current run.

Once the 2 composers are loaded and resolved, extraction of each extension's notes will begin. For most extensions, the version range will be automatic. You will be prompted for the start version of any extension missing from composer #1, and the end version of any extension missing from composer #2.

When you are prompted for versions, there will be a suggestion auto-filled - it represents the earliest or latest version available. Press `Enter` to accept, or type a different version.

You can also press `s` to skip notes for that extension.

### 2. Composers mode - pass 2 local files as params

```sh
taoReleaseNotes composers --c1 <path/to/composer1.json> --c2 <path/to/composer2.json>
```

Same as the other `composers` mode, except you must pass the file paths explicitly.

### 3. Single extension mode

```sh
taoReleaseNotes single -e <repo-name>
```

This command fetches the release notes for a single extension you specify as a parameter. It should be in the form of the Github repo name, e.g. `extension-tao-items`.

You will be prompted to enter the start and end version of your desired release notes range.

#### Full list of CLI parameters

| Short & long form         | Type | Modes available in | Description                           |
|---------------------------|------|--------------------|---------------------------------------|
| `--c1 <file>`             |      | `composers`        | Relative path to first composer file  |
| `--c2 <file>`             |      | `composers`        | Relative path to second composer file |
| `-a`, `--autoVersions`    | Flag | `composers`        | Automatically select missing versions |
| `--extension <extension>` |      | `single`           | Repo name of an individual extension  |

## Output

All extracted notes will be put into a folder `release_notes/{timestamp}/`.

At the end of the run, a concatenated file, `all_notes.md`, will be generated in the same location.
